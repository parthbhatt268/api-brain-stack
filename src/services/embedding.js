'use strict';

// gemini-embedding-001 — supports 768 / 1536 / 3072 dims via output_dimensionality
const EMBEDDING_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

async function generateEmbedding(text) {
  const res = await fetch(EMBEDDING_URL, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'x-goog-api-key': process.env.GOOGLE_API_KEY,
    },
    body: JSON.stringify({
      model:                'models/gemini-embedding-001',
      content:              { parts: [{ text }] },
      output_dimensionality: 768,
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
