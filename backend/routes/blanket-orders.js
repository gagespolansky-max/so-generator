const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

// GET /api/blanket-orders
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, status } = req.query;
    let q = `
      SELECT
        bo.*,
        c.customer_name,
        c.customer_code,
        COUNT(DISTINCT o.id) as release_count,
        COALESCE(SUM(ol.qty), 0) as released_qty,
        COALESCE(SUM(ol.qty * ol.sell_price), 0) as released_sell
      FROM blanket_orders bo
      LEFT JOIN customers c ON bo.customer_id = c.id
      LEFT JOIN orders o ON o.parent_blanket_id = bo.id
      LEFT JOIN order_lines ol ON ol.order_id = o.id
      WHERE 1=1
    `;
    const p = [];
    if (search) {
      q += ' AND (bo.po_number LIKE ? OR c.customer_name LIKE ? OR bo.description LIKE ? OR bo.salesperson LIKE ?)';
      const s = `%${search}%`;
      p.push(s, s, s, s);
    }
    if (status) { q += ' AND bo.status = ?'; p.push(status); }
    q += ' GROUP BY bo.id ORDER BY bo.created_at DESC';
    res.json(db.prepare(q).all(...p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/blanket-orders/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const bo = db.prepare(`
      SELECT bo.*, c.customer_name, c.customer_code
      FROM blanket_orders bo
      LEFT JOIN customers c ON bo.customer_id = c.id
      WHERE bo.id = ?
    `).get(req.params.id);
    if (!bo) return res.status(404).json({ error: 'Blanket order not found' });

    const commitments = db.prepare(
      'SELECT * FROM blanket_order_lines WHERE blanket_order_id = ? ORDER BY id'
    ).all(req.params.id);

    const releases = db.prepare(`
      SELECT
        o.id, o.so_number, o.po_number, o.ship_date, o.status,
        o.salesperson, o.cancel_date,
        COUNT(ol.id) as line_count,
        COALESCE(SUM(ol.qty), 0) as total_qty,
        COALESCE(SUM(ol.qty * ol.sell_price), 0) as total_sell
      FROM orders o
      LEFT JOIN order_lines ol ON ol.order_id = o.id
      WHERE o.parent_blanket_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all(req.params.id);

    res.json({ ...bo, commitments, releases });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/blanket-orders
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const d = req.body;
    const create = db.transaction(() => {
      const r = db.prepare(`
        INSERT INTO blanket_orders (
          po_number, customer_id, description, salesperson,
          total_committed_qty, cancel_date_start, cancel_date_end,
          status, notes
        ) VALUES (
          @po_number, @customer_id, @description, @salesperson,
          @total_committed_qty, @cancel_date_start, @cancel_date_end,
          @status, @notes
        )
      `).run({
        po_number: d.po_number || '',
        customer_id: d.customer_id || null,
        description: d.description || '',
        salesperson: d.salesperson || '',
        total_committed_qty: d.total_committed_qty || 0,
        cancel_date_start: d.cancel_date_start || '',
        cancel_date_end: d.cancel_date_end || '',
        status: d.status || 'open',
        notes: d.notes || '',
      });
      const newId = r.lastInsertRowid;
      insertCommitments(db, newId, d.commitments);
      return newId;
    });
    const newId = create();
    const bo = db.prepare('SELECT * FROM blanket_orders WHERE id = ?').get(newId);
    res.status(201).json(bo);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/blanket-orders/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const d = req.body;
    const existing = db.prepare('SELECT id FROM blanket_orders WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Blanket order not found' });

    const update = db.transaction(() => {
      db.prepare(`
        UPDATE blanket_orders SET
          po_number=@po_number, customer_id=@customer_id, description=@description,
          salesperson=@salesperson, total_committed_qty=@total_committed_qty,
          cancel_date_start=@cancel_date_start, cancel_date_end=@cancel_date_end,
          status=@status, notes=@notes
        WHERE id=@id
      `).run({
        id: req.params.id,
        po_number: d.po_number || '',
        customer_id: d.customer_id || null,
        description: d.description || '',
        salesperson: d.salesperson || '',
        total_committed_qty: d.total_committed_qty || 0,
        cancel_date_start: d.cancel_date_start || '',
        cancel_date_end: d.cancel_date_end || '',
        status: d.status || 'open',
        notes: d.notes || '',
      });
      db.prepare('DELETE FROM blanket_order_lines WHERE blanket_order_id = ?').run(req.params.id);
      insertCommitments(db, req.params.id, d.commitments);
    });
    update();
    const bo = db.prepare('SELECT * FROM blanket_orders WHERE id = ?').get(req.params.id);
    res.json(bo);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/blanket-orders/:id/status
router.patch('/:id/status', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    db.prepare('UPDATE blanket_orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true, status });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/blanket-orders/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    // Unlink child orders rather than deleting them
    db.prepare('UPDATE orders SET parent_blanket_id = NULL WHERE parent_blanket_id = ?').run(req.params.id);
    db.prepare('DELETE FROM blanket_orders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function insertCommitments(db, blanketId, commitments) {
  if (!Array.isArray(commitments)) return;
  const stmt = db.prepare(`
    INSERT INTO blanket_order_lines (blanket_order_id, style_number, color, total_qty, sell_price, first_cost)
    VALUES (@blanket_order_id, @style_number, @color, @total_qty, @sell_price, @first_cost)
  `);
  for (const c of commitments) {
    stmt.run({
      blanket_order_id: blanketId,
      style_number: c.style_number || '',
      color: c.color || '',
      total_qty: c.total_qty || 0,
      sell_price: c.sell_price || 0,
      first_cost: c.first_cost || 0,
    });
  }
}

module.exports = router;
