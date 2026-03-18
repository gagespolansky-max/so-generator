const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

// GET /api/comments/:orderId
router.get('/:orderId', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM order_comments WHERE order_id = ? ORDER BY created_at ASC'
    ).all(req.params.orderId);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/comments/:orderId
router.post('/:orderId', (req, res) => {
  try {
    const db = getDb();
    const { author, body, line_style_number, mentions } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ error: 'body is required' });
    const r = db.prepare(`
      INSERT INTO order_comments (order_id, author, body, line_style_number, mentions)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.params.orderId,
      author || 'Anonymous',
      body.trim(),
      line_style_number || null,
      JSON.stringify(mentions || [])
    );
    const comment = db.prepare('SELECT * FROM order_comments WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json(comment);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/comments/:orderId/:commentId/resolve
router.patch('/:orderId/:commentId/resolve', (req, res) => {
  try {
    const db = getDb();
    const { resolved_by } = req.body;
    const existing = db.prepare('SELECT * FROM order_comments WHERE id = ? AND order_id = ?')
      .get(req.params.commentId, req.params.orderId);
    if (!existing) return res.status(404).json({ error: 'Comment not found' });
    const nowResolved = !existing.resolved;
    db.prepare(`
      UPDATE order_comments SET
        resolved = ?,
        resolved_by = ?,
        resolved_at = ?
      WHERE id = ?
    `).run(
      nowResolved ? 1 : 0,
      nowResolved ? (resolved_by || 'Unknown') : null,
      nowResolved ? new Date().toISOString() : null,
      req.params.commentId
    );
    const updated = db.prepare('SELECT * FROM order_comments WHERE id = ?').get(req.params.commentId);
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/comments/:orderId/:commentId
router.delete('/:orderId/:commentId', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM order_comments WHERE id = ? AND order_id = ?')
      .run(req.params.commentId, req.params.orderId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
