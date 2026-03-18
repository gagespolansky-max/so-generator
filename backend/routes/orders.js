const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

const ORDER_FIELDS = ['so_number','log_number','po_number','customer_id','salesperson','entered_by',
  'order_date','ship_date','cancel_date','mabd','status',
  'suffocation_warning','pre_ticket','pre_pack','pre_pack_label','pre_pack_details',
  'cards_hangers','cards_hangers_brand','sewn_in_label','testing_required','testing_procedure',
  'ship_direct_nj','ship_direct_la','ship_fob_dtc','in_stock_order','closeout_order',
  'top_samples','pre_production_samples','other_notes','parent_blanket_id'];

const TRACKED_FIELDS = ['po_number','so_number','ship_date','cancel_date','mabd','status','salesperson'];

function buildDiff(before, after) {
  const changes = [];
  for (const f of TRACKED_FIELDS) {
    const a = String(before[f] ?? ''), b = String(after[f] ?? '');
    if (a !== b) {
      const label = f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      changes.push(`${label} changed from "${a || '—'}" to "${b || '—'}"`);
    }
  }
  return changes;
}

// GET /api/orders
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, status, customer_id } = req.query;
    let q = `
      SELECT o.*, c.customer_name, c.customer_code,
        COUNT(ol.id) as line_count,
        COALESCE(SUM(ol.qty), 0) as total_qty,
        COALESCE(SUM(ol.qty * ol.sell_price), 0) as total_sell
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_lines ol ON o.id = ol.order_id
      WHERE 1=1
    `;
    const p = [];
    if (search)      { q += ' AND (o.so_number LIKE ? OR o.po_number LIKE ? OR c.customer_name LIKE ? OR o.salesperson LIKE ?)'; const s=`%${search}%`; p.push(s,s,s,s); }
    if (status)      { q += ' AND o.status = ?'; p.push(status); }
    if (customer_id) { q += ' AND o.customer_id = ?'; p.push(customer_id); }
    q += ' GROUP BY o.id ORDER BY o.created_at DESC';
    res.json(db.prepare(q).all(...p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare(`
      SELECT o.*, c.customer_name, c.customer_code, c.nj_wh_rate, c.ca_wh_rate, c.terms_rate
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const lines = db.prepare(`
      SELECT ol.*, s.description
      FROM order_lines ol
      LEFT JOIN styles s ON ol.style_number = s.style_number
      WHERE ol.order_id = ?
      ORDER BY ol.line_number
    `).all(req.params.id);
    res.json({ ...order, lines });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/orders/:id/changes
router.get('/:id/changes', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM order_changes WHERE order_id = ? ORDER BY changed_at DESC').all(req.params.id);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function insertLines(db, orderId, lines) {
  const stmt = db.prepare(`
    INSERT INTO order_lines (
      order_id, line_number, style_number, color, size,
      ppk_ctg, qty, sell_price, retail_price, vpo_number,
      first_cost, vendor, agent_fee, freight, misc,
      duty_pct, tariff1_pct, tariff2_pct, tariff3_pct, royalty_pct,
      shipping_mode, remarks
    ) VALUES (
      @order_id, @line_number, @style_number, @color, @size,
      @ppk_ctg, @qty, @sell_price, @retail_price, @vpo_number,
      @first_cost, @vendor, @agent_fee, @freight, @misc,
      @duty_pct, @tariff1_pct, @tariff2_pct, @tariff3_pct, @royalty_pct,
      @shipping_mode, @remarks
    )
  `);
  for (const [i, l] of (lines || []).entries()) {
    stmt.run({
      order_id: orderId, line_number: i + 1,
      style_number: l.style_number || '',
      color: l.color || '', size: l.size || '',
      ppk_ctg: l.ppk_ctg || 0, qty: l.qty || 0,
      sell_price: l.sell_price || 0, retail_price: l.retail_price || 0,
      vpo_number: l.vpo_number || '',
      first_cost: l.first_cost || 0, vendor: l.vendor || '',
      agent_fee: l.agent_fee || 0, freight: l.freight ?? 0.15, misc: l.misc ?? 0.07,
      duty_pct: l.duty_pct ?? 0.146, tariff1_pct: l.tariff1_pct ?? 0.075,
      tariff2_pct: l.tariff2_pct ?? 0.200, tariff3_pct: l.tariff3_pct ?? 0,
      royalty_pct: l.royalty_pct || 0,
      shipping_mode: l.shipping_mode || 'BOAT', remarks: l.remarks || '',
    });
  }
}

// POST /api/orders
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const d = req.body;
    const create = db.transaction(() => {
      const r = db.prepare(`
        INSERT INTO orders (
          so_number, log_number, po_number, customer_id, salesperson, entered_by,
          order_date, ship_date, cancel_date, mabd, status,
          suffocation_warning, pre_ticket, pre_pack, pre_pack_label, pre_pack_details,
          cards_hangers, cards_hangers_brand, sewn_in_label, testing_required, testing_procedure,
          ship_direct_nj, ship_direct_la, ship_fob_dtc, in_stock_order, closeout_order,
          top_samples, pre_production_samples, other_notes, parent_blanket_id
        ) VALUES (
          @so_number, @log_number, @po_number, @customer_id, @salesperson, @entered_by,
          @order_date, @ship_date, @cancel_date, @mabd, @status,
          @suffocation_warning, @pre_ticket, @pre_pack, @pre_pack_label, @pre_pack_details,
          @cards_hangers, @cards_hangers_brand, @sewn_in_label, @testing_required, @testing_procedure,
          @ship_direct_nj, @ship_direct_la, @ship_fob_dtc, @in_stock_order, @closeout_order,
          @top_samples, @pre_production_samples, @other_notes, @parent_blanket_id
        )
      `).run({
        so_number: d.so_number || null, log_number: d.log_number || '',
        po_number: d.po_number || '', customer_id: d.customer_id || null,
        salesperson: d.salesperson || '', entered_by: d.entered_by || '',
        order_date: d.order_date || '', ship_date: d.ship_date || '',
        cancel_date: d.cancel_date || '', mabd: d.mabd || '',
        status: d.status || 'draft',
        suffocation_warning: d.suffocation_warning ?? 1, pre_ticket: d.pre_ticket ?? 1,
        pre_pack: d.pre_pack ?? 1, pre_pack_label: d.pre_pack_label ?? 0,
        pre_pack_details: d.pre_pack_details || '',
        cards_hangers: d.cards_hangers ?? 1, cards_hangers_brand: d.cards_hangers_brand || '',
        sewn_in_label: d.sewn_in_label ?? 0, testing_required: d.testing_required ?? 0,
        testing_procedure: d.testing_procedure || '',
        ship_direct_nj: d.ship_direct_nj ?? 0, ship_direct_la: d.ship_direct_la ?? 1,
        ship_fob_dtc: d.ship_fob_dtc ?? 0, in_stock_order: d.in_stock_order ?? 0,
        closeout_order: d.closeout_order ?? 0, top_samples: d.top_samples ?? 1,
        pre_production_samples: d.pre_production_samples ?? 0,
        other_notes: d.other_notes || '',
        parent_blanket_id: d.parent_blanket_id || null,
      });
      const newId = r.lastInsertRowid;
      insertLines(db, newId, d.lines);
      // Log creation
      db.prepare(`INSERT INTO order_changes (order_id, changed_by, change_type, summary) VALUES (?, ?, 'create', ?)`
      ).run(newId, d.entered_by || 'System', `Order created with ${(d.lines || []).length} line(s)`);
      return newId;
    });
    const newId = create();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(newId);
    res.status(201).json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/orders/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const d = req.body;
    const before = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!before) return res.status(404).json({ error: 'Order not found' });

    const update = db.transaction(() => {
      db.prepare(`
        UPDATE orders SET
          so_number=@so_number, log_number=@log_number, po_number=@po_number,
          customer_id=@customer_id, salesperson=@salesperson, entered_by=@entered_by,
          order_date=@order_date, ship_date=@ship_date, cancel_date=@cancel_date,
          mabd=@mabd, status=@status,
          suffocation_warning=@suffocation_warning, pre_ticket=@pre_ticket,
          pre_pack=@pre_pack, pre_pack_label=@pre_pack_label, pre_pack_details=@pre_pack_details,
          cards_hangers=@cards_hangers, cards_hangers_brand=@cards_hangers_brand,
          sewn_in_label=@sewn_in_label, testing_required=@testing_required,
          testing_procedure=@testing_procedure, ship_direct_nj=@ship_direct_nj,
          ship_direct_la=@ship_direct_la, ship_fob_dtc=@ship_fob_dtc,
          in_stock_order=@in_stock_order, closeout_order=@closeout_order,
          top_samples=@top_samples, pre_production_samples=@pre_production_samples,
          other_notes=@other_notes, parent_blanket_id=@parent_blanket_id
        WHERE id=@id
      `).run({
        id: req.params.id,
        so_number: d.so_number || null, log_number: d.log_number || '',
        po_number: d.po_number || '', customer_id: d.customer_id || null,
        salesperson: d.salesperson || '', entered_by: d.entered_by || '',
        order_date: d.order_date || '', ship_date: d.ship_date || '',
        cancel_date: d.cancel_date || '', mabd: d.mabd || '',
        status: d.status || 'draft',
        suffocation_warning: d.suffocation_warning ?? 1, pre_ticket: d.pre_ticket ?? 1,
        pre_pack: d.pre_pack ?? 1, pre_pack_label: d.pre_pack_label ?? 0,
        pre_pack_details: d.pre_pack_details || '',
        cards_hangers: d.cards_hangers ?? 1, cards_hangers_brand: d.cards_hangers_brand || '',
        sewn_in_label: d.sewn_in_label ?? 0, testing_required: d.testing_required ?? 0,
        testing_procedure: d.testing_procedure || '',
        ship_direct_nj: d.ship_direct_nj ?? 0, ship_direct_la: d.ship_direct_la ?? 1,
        ship_fob_dtc: d.ship_fob_dtc ?? 0, in_stock_order: d.in_stock_order ?? 0,
        closeout_order: d.closeout_order ?? 0, top_samples: d.top_samples ?? 1,
        pre_production_samples: d.pre_production_samples ?? 0,
        other_notes: d.other_notes || '',
        parent_blanket_id: d.parent_blanket_id || null,
      });

      // Replace lines
      db.prepare('DELETE FROM order_lines WHERE order_id = ?').run(req.params.id);
      insertLines(db, req.params.id, d.lines);

      // Log changes
      const after = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
      const fieldChanges = buildDiff(before, after);
      const linesBefore = db.prepare('SELECT COUNT(*) as n FROM order_lines WHERE order_id=?').get(req.params.id).n;
      if (d.lines && d.lines.length !== (before._lineCount || 0)) {
        fieldChanges.push(`Line items updated (${d.lines.length} lines)`);
      }
      if (fieldChanges.length > 0) {
        db.prepare(`INSERT INTO order_changes (order_id, changed_by, change_type, summary, diff_json) VALUES (?, ?, 'update', ?, ?)`
        ).run(
          req.params.id,
          d.changed_by || d.entered_by || d.salesperson || 'System',
          fieldChanges.join('; '),
          JSON.stringify(fieldChanges)
        );
      }
    });
    update();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    const lines = db.prepare('SELECT * FROM order_lines WHERE order_id = ? ORDER BY line_number').all(req.params.id);
    res.json({ ...order, lines });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', (req, res) => {
  try {
    const db = getDb();
    const { status, changed_by } = req.body;
    const before = db.prepare('SELECT status, salesperson FROM orders WHERE id=?').get(req.params.id);
    db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
    if (before && before.status !== status) {
      db.prepare(`INSERT INTO order_changes (order_id, changed_by, change_type, summary) VALUES (?, ?, 'status', ?)`
      ).run(req.params.id, changed_by || before.salesperson || 'System',
        `Status changed from "${before.status}" to "${status}"`);
    }
    res.json({ success: true, status });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/orders/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM order_lines WHERE order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
