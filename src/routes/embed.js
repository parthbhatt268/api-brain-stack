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

// POST /api/embed
// Called by the frontend right after saving a node.
// Generates a vector embedding for the node's summary and stores it.

router.post('/', authenticate, async (req, res) => {
  const { nodeId, summary } = req.body ?? {};

  if (!nodeId || !summary) {
    return res.status(400).json({ error: 'Missing fields: nodeId, summary' });
  }

  // 1 — generate 768-dim embedding from the summary text
  let vector;
  try {
    vector = await generateEmbedding(summary);
  } catch (err) {
    return res.status(502).json({ error: `Embedding failed: ${err.message}` });
  }

  // 2 — store in the DB
  //     .eq('user_id', req.user.id) ensures a user can only embed their own nodes
  const { error } = await supabase
    .from('nodes')
    .update({ embedding: vector })
    .eq('id', nodeId)
    .eq('user_id', req.user.id);

  if (error) {
    return res.status(500).json({ error: `DB update failed: ${error.message}` });
  }

  res.json({ ok: true });
});

module.exports = router;
