'use strict';

// Gemini text-embedding-004 — 768-dimensional embeddings, no API key tier issues
const EMBEDDING_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

async function generateEmbedding(text) {
  const res = await fetch(EMBEDDING_URL, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'x-goog-api-key': process.env.GOOGLE_API_KEY,
    },
    body: JSON.stringify({
      model:   'models/text-embedding-004',
      content: { parts: [{ text }] },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini embedding API ${res.status}: ${detail}`);
  }

  const data = await res.json();
  return data.embedding.values; // float[]  — 768 numbers
}

module.exports = { generateEmbedding };
