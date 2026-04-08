const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authenticate = require('../middleware/auth');

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

  res.json({ inserted: data.length });
});

module.exports = router;
