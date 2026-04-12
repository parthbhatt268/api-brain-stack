'use strict';

const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

// ─────────────────────────────────────────────────────────────────────────────
// Source detection
// ─────────────────────────────────────────────────────────────────────────────

function detectSource(urlString) {
  const host = new URL(urlString).hostname.replace('www.', '');
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('reddit.com'))   return 'reddit';
  if (host.includes('github.com'))   return 'github';
  if (host.includes('linkedin.com')) return 'linkedin';
  return 'article';
}

// ─────────────────────────────────────────────────────────────────────────────
// YouTube — direct InnerTube API call (no package needed, no API key needed)
// ─────────────────────────────────────────────────────────────────────────────

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g,           (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function parseTranscriptXml(xml) {
  const lines = [];

  // Format A: <text start="…" dur="…">content</text>  (most common)
  for (const m of xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
    const t = decodeHtmlEntities(m[1]).trim();
    if (t) lines.push(t);
  }

  // Format B: <p t="…" d="…"><s>word</s>…</p>  (newer auto-captions)
  if (lines.length === 0) {
    for (const m of xml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
      const words = [...m[1].matchAll(/<s[^>]*>([^<]*)<\/s>/g)].map(w => w[1]);
      const line  = words.length ? words.join('') : m[1].replace(/<[^>]+>/g, '');
      const t     = decodeHtmlEntities(line).trim();
      if (t) lines.push(t);
    }
  }

  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

async function extractYouTube(url) {
  const parsed = new URL(url);
  let videoId;

  if (parsed.hostname.includes('youtu.be')) {
    videoId = parsed.pathname.slice(1).split('?')[0];
  } else if (parsed.pathname.startsWith('/shorts/')) {
    videoId = parsed.pathname.split('/shorts/')[1].split('?')[0];
  } else {
    videoId = parsed.searchParams.get('v');
  }

  if (!videoId) throw new Error('Could not parse YouTube video ID from URL');

  // Step 1 — ask YouTube's InnerTube API for caption track URLs
  const playerRes = await fetch(
    'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
    {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':   'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
      },
      body: JSON.stringify({
        context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
        videoId,
      }),
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!playerRes.ok) throw new Error(`YouTube player API returned ${playerRes.status}`);

  const playerData = await playerRes.json();
  const tracks     = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error('No captions available for this video');
  }

  // Step 2 — fetch the caption XML from the first available track
  const captionRes = await fetch(tracks[0].baseUrl, { signal: AbortSignal.timeout(8000) });
  if (!captionRes.ok) throw new Error(`Caption fetch returned ${captionRes.status}`);

  const xml  = await captionRes.text();
  const text = parseTranscriptXml(xml);

  // Fetch title via oEmbed (no API key needed)
  let title = `YouTube video ${videoId}`;
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      title = oembed.title || title;
    }
  } catch { /* title fallback is fine */ }

  return { title, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reddit — public JSON API, no auth needed
// ─────────────────────────────────────────────────────────────────────────────

async function extractReddit(url) {
  const cleanUrl = url.replace(/\/$/, '');
  const jsonUrl  = cleanUrl + '.json';

  const res = await fetch(jsonUrl, {
    headers: { 'User-Agent': 'BrainStack/1.0 (personal knowledge graph; contact via GitHub)' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Reddit API returned ${res.status}`);

  const data = await res.json();
  const post = data[0]?.data?.children?.[0]?.data;
  if (!post) throw new Error('Unexpected Reddit API response shape');

  const title    = post.title ?? '';
  const selftext = post.selftext ?? '';        // empty for link posts
  const text     = selftext ? `${title}\n\n${selftext}` : title;

  return { title, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub — README via GitHub API (no auth for public repos)
// ─────────────────────────────────────────────────────────────────────────────

async function extractGitHub(url) {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  const owner = parts[0];
  const repo  = parts[1];
  if (!owner || !repo) throw new Error('Could not parse owner/repo from GitHub URL');

  const headers = { 'User-Agent': 'BrainStack/1.0' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;

  // Get repo description
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!repoRes.ok) throw new Error(`GitHub API returned ${repoRes.status}`);
  const repoData = await repoRes.json();
  const title    = `${repoData.full_name}${repoData.description ? ' — ' + repoData.description : ''}`;

  // Get raw README
  const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: { ...headers, Accept: 'application/vnd.github.raw+json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!readmeRes.ok) throw new Error(`GitHub README fetch returned ${readmeRes.status}`);
  const text = await readmeRes.text();

  return { title, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// Articles + LinkedIn — Mozilla Readability (same engine Firefox Reader Mode uses)
// ─────────────────────────────────────────────────────────────────────────────

async function extractArticle(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; BrainStackBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Page fetch returned ${res.status}`);
  const html = await res.text();

  const dom     = new JSDOM(html, { url });
  const reader  = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) throw new Error('Readability could not parse an article from this page');

  const title = article.title ?? '';
  // textContent gives clean plain text, no HTML tags
  const text  = (article.textContent ?? '').replace(/\s+/g, ' ').trim();

  return { title, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

async function extractContent(url) {
  const source = detectSource(url);

  switch (source) {
    case 'youtube':
      // Captions may be disabled, not yet generated, or blocked from server IPs.
      // Fall back to Readability on the watch page (gets title + description at minimum).
      try {
        return { source, ...(await extractYouTube(url)) };
      } catch {
        return { source, ...(await extractArticle(url)) };
      }
    case 'reddit':   return { source, ...(await extractReddit(url)) };
    case 'github':   return { source, ...(await extractGitHub(url)) };
    case 'linkedin':
    case 'article':
    default:         return { source, ...(await extractArticle(url)) };
  }
}

module.exports = { detectSource, extractContent };
