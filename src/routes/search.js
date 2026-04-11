'use strict';

const express    = require('express');
const { createClient } = require('@supabase/supabase-js');
const authenticate     = require('../middleware/auth');
const { generateEmbedding } = require('../services/embedding');

const router   = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/search
// Called when the user types a query in the search bar.
// Embeds the query, then finds the closest matching node via pgvector cosine similarity.

router.post('/', authenticate, async (req, res) => {
  const { query, categoryFilter = 'all' } = req.body ?? {};

  if (!query) {
    return res.status(400).json({ error: 'Missing field: query' });
  }

  // 1 — embed the search query
  let vector;
  try {
    vector = await generateEmbedding(query);
  } catch (err) {
    return res.status(502).json({ error: `Embedding failed: ${err.message}` });
  }

  // 2 — vector similarity search via the search_nodes Postgres function
  //     (defined in supabase/vector_search_setup.sql)
  //     <=> is pgvector cosine distance — ORDER BY gives closest first
  const { data, error } = await supabase.rpc('search_nodes', {
    query_embedding: vector,
    p_user_id:       req.user.id,
    p_category:      categoryFilter || 'all',
    p_limit:         1,
  });

  if (error) {
    return res.status(500).json({ error: `Search failed: ${error.message}` });
  }

  const nodeId = data?.length > 0 ? data[0].id : null;
  res.json({ nodeId });
});

module.exports = router;
