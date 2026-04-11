'use strict';

const express        = require('express');
const authenticate   = require('../middleware/auth');
const { extractContent } = require('../services/extractor');

const router = express.Router();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ─────────────────────────────────────────────────────────────────────────────
// LLM system prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a knowledge graph classifier for a personal knowledge management app called Brain Stack.

Given the title and full content of a webpage, video transcript, or repository README, return a JSON object with exactly these four fields:

- category: one short lowercase word that best describes the topic (e.g. "ai", "finance", "cooking", "music", "fitness", "design", "politics")
- subcategory: a 2–4 word phrase that is more specific, or null if unclear (e.g. "LLM fine-tuning", "index funds", "Italian cuisine")
- summary: a 150–200 word summary written in plain English. Capture the main idea, key points, and why it matters. Do not truncate — write the full summary.
- origin: always the string "added"

Rules:
- Respond with valid JSON only.
- No markdown fences, no explanation, no extra fields.
- If the content is too short or unclear to summarise, do your best with what is available.`;

// ─────────────────────────────────────────────────────────────────────────────
// URL validation helpers
// ─────────────────────────────────────────────────────────────────────────────

function isPrivateHost(hostname) {
  if (hostname === 'localhost' || hostname === '::1') return true;
  const parts = hostname.split('.').map(Number);
  if (parts.length === 4) {
    const [a, b] = parts;
    if (a === 127)                          return true; // loopback
    if (a === 10)                           return true; // private class A
    if (a === 192 && b === 168)             return true; // private class C
    if (a === 172 && b >= 16 && b <= 31)   return true; // private class B
    if (a === 169 && b === 254)             return true; // link-local
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/analyse
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', authenticate, async (req, res) => {

  // 1 — validate URL ──────────────────────────────────────────────────────────

  const rawUrl = req.body?.url?.trim();
  if (!rawUrl) return res.status(400).json({ error: 'Missing field: url' });

  let parsed;
  try { parsed = new URL(rawUrl); } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (parsed.protocol !== 'https:')
    return res.status(400).json({ error: 'Only https:// URLs are allowed' });

  if (isPrivateHost(parsed.hostname))
    return res.status(400).json({ error: 'Private/loopback URLs are not allowed' });

  // 2 — extract content ───────────────────────────────────────────────────────

  let extracted;
  try {
    extracted = await extractContent(rawUrl);
  } catch (err) {
    return res.status(502).json({ error: `Content extraction failed: ${err.message}` });
  }

  const { title, text, source } = extracted;

  if (!text || text.trim().length === 0) {
    return res.status(502).json({ error: 'Could not extract any readable content from this URL' });
  }

  // Truncate at 150k chars — comfortably within Claude's 200k token context window
  const MAX_CHARS   = 150_000;
  const truncated   = text.length > MAX_CHARS;
  const contentBody = text.slice(0, MAX_CHARS);
  const userMessage = `Title: ${title}\n\n${truncated ? '[Content truncated to 150,000 characters]\n\n' : ''}Content:\n${contentBody}`;

  // 3 — call Gemini 2.5 Flash ─────────────────────────────────────────────────

  let classification;
  try {
    const geminiRes = await fetch(GEMINI_API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'x-goog-api-key': process.env.GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${userMessage}` }],
        }],
        generationConfig: { temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      return res.status(502).json({ error: `Gemini API error: HTTP ${geminiRes.status}`, detail });
    }

    const geminiBody = await geminiRes.json();
    const raw        = geminiBody.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned    = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    classification   = JSON.parse(cleaned);
  } catch (err) {
    return res.status(502).json({ error: `LLM classification failed: ${err.message}` });
  }

  // 4 — respond ───────────────────────────────────────────────────────────────

  res.json({
    category:    classification.category    ?? 'general',
    subcategory: classification.subcategory ?? null,
    summary:     classification.summary     ?? '',
    origin:      'added',
    source,      // detected server-side — frontend can skip its own detectSource()
  });
});

module.exports = router;
