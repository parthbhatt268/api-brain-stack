const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authenticate = require('../middleware/auth');
const { generateEmbedding } = require('../services/embedding');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;

  if (userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data ?? []);
});

router.post('/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;

  if (userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { nodes } = req.body;
  if (!Array.isArray(nodes)) {
    return res.status(400).json({ error: 'Body must contain a nodes array' });
  }

  const { error: deleteError } = await supabase
    .from('nodes')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  if (nodes.length === 0) {
    return res.json({ inserted: 0 });
  }

  const rows = nodes.map((node) => ({ ...node, user_id: userId }));

  const { data, error: insertError } = await supabase
    .from('nodes')
    .insert(rows)
    .select();

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  // Auto-embed each node's summary immediately after saving so vector search works
  const embedResults = await Promise.allSettled(
    data
      .filter(node => node.summary)
      .map(async (node) => {
        const vector = await generateEmbedding(node.summary);
        const { error: embedError } = await supabase
          .from('nodes')
          .update({ embedding: vector })
          .eq('id', node.id);
        if (embedError) throw new Error(embedError.message);
      })
  );

  const embedFailed = embedResults.filter(r => r.status === 'rejected').length;
  if (embedFailed > 0) {
    console.warn(`[graph] ${embedFailed}/${data.length} nodes failed to embed`);
  }

  res.json({ inserted: data.length, embedded: data.length - embedFailed });
});

module.exports = router;
