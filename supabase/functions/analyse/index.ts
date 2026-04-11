import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Blocks private/loopback address ranges
function isPrivateHostname(hostname: string): boolean {
  // Reject localhost variants
  if (hostname === "localhost" || hostname === "::1") return true;

  // Parse dotted-decimal IPv4
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b, c] = ipv4.map(Number);
    if (a === 127) return true; // 127.x.x.x  loopback
    if (a === 10) return true; // 10.x.x.x   private
    if (a === 192 && b === 168) return true; // 192.168.x.x private
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16-31.x private
    if (a === 169 && b === 254) return true; // 169.254.x.x link-local
  }

  return false;
}

function extractMeta(html: string): { title: string; description: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const descMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    );
  const description = descMatch ? descMatch[1].trim() : "";

  return { title, description };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── 1. Parse and validate the URL ──────────────────────────────────────────
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const rawUrl = body.url?.trim();
  if (!rawUrl) {
    return new Response(JSON.stringify({ error: "Missing field: url" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (parsed.protocol !== "https:") {
    return new Response(
      JSON.stringify({ error: "Only https:// URLs are allowed" }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  if (isPrivateHostname(parsed.hostname)) {
    return new Response(
      JSON.stringify({ error: "Private/loopback URLs are not allowed" }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  // ── 2. Fetch the page ───────────────────────────────────────────────────────
  let pageHtml: string;
  try {
    const pageRes = await fetch(rawUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrainStackBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!pageRes.ok) {
      return new Response(
        JSON.stringify({ error: `Page fetch failed: HTTP ${pageRes.status}` }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }
    pageHtml = await pageRes.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: `Page fetch failed: ${message}` }),
      {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  const { title, description } = extractMeta(pageHtml);

  // ── 3. Call Gemini Flash ────────────────────────────────────────────────────
  const GEMINI_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "Server misconfiguration: missing GOOGLE_API_KEY",
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  const prompt = `You are a knowledge graph classifier. Given a web page title and description,
return a JSON object with exactly these fields:
- category: one short lowercase word (e.g. "ai", "gardening", "guitar", "cooking")
- subcategory: a 2-4 word phrase within that category, or null if unclear
- summary: exactly few sentences (~150 words) summarising what this content is about
- origin: always the string "added"

Page title: ${title}
Page description: ${description}

Respond with valid JSON only. No explanation, no markdown fences.`;

  let geminiJson: {
    category: string;
    subcategory: string | null;
    summary: string;
    origin: string;
  };
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({
          error: `Gemini API error: HTTP ${geminiRes.status}`,
          detail: errText,
        }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    const geminiBody = await geminiRes.json();
    const rawText: string =
      geminiBody.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown code fences if the model returns them despite instructions
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    geminiJson = JSON.parse(cleaned);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: `LLM call failed: ${message}` }),
      {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  // ── 4. Return the result ────────────────────────────────────────────────────
  return new Response(
    JSON.stringify({
      category: geminiJson.category ?? "general",
      subcategory: geminiJson.subcategory ?? null,
      summary: geminiJson.summary ?? "",
      origin: "added",
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    },
  );
});
