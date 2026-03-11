const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { generateExcel } = require('../utils/excel');

router.get('/:orderId', async (req, res) => {
  const db = getDb();
  const order = db.prepare(`
    SELECT o.*, c.customer_code, c.customer_name, c.nj_wh_rate, c.ca_wh_rate, c.terms_rate
    FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `).get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const lines = db.prepare(`
    SELECT ol.*, s.description
    FROM order_lines ol LEFT JOIN styles s ON ol.style_number = s.style_number
    WHERE ol.order_id = ? ORDER BY ol.line_number
  `).all(req.params.orderId);

  try {
    const workbook = await generateExcel(order, lines);
    const filename = `SO_${order.so_number || order.id}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    db.prepare("UPDATE orders SET status='exported' WHERE id=?").run(req.params.orderId);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
