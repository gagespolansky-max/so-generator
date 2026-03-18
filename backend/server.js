const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/styles',         require('./routes/styles'));
app.use('/api/customers',      require('./routes/customers'));
app.use('/api/orders',         require('./routes/orders'));
app.use('/api/export',         require('./routes/export'));
app.use('/api/hts',            require('./routes/hts'));
app.use('/api/comments',       require('./routes/comments'));
app.use('/api/blanket-orders', require('./routes/blanket-orders'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'sqlite', time: new Date().toISOString() }));

app.get('/api/stats', (req, res) => {
  const { getDb } = require('./db/schema');
  const db = getDb();
  const totalStyles = db.prepare('SELECT COUNT(*) as n FROM styles WHERE active=1').get().n;
  const orderRows = db.prepare('SELECT status, COUNT(*) as n FROM orders GROUP BY status').all();
  const orders = { draft: 0, confirmed: 0, exported: 0, total: 0 };
  for (const row of orderRows) { orders[row.status] = row.n; orders.total += row.n; }

  const boRows = db.prepare('SELECT status, COUNT(*) as n FROM blanket_orders GROUP BY status').all();
  const blanketOrders = { open: 0, partial: 0, fulfilled: 0, closed: 0, total: 0 };
  for (const row of boRows) { blanketOrders[row.status] = row.n; blanketOrders.total += row.n; }

  const unresolvedComments = db.prepare('SELECT COUNT(*) as n FROM order_comments WHERE resolved=0').get().n;

  res.json({ totalStyles, orders, blanketOrders, unresolvedComments });
});

require('./db/schema').getDb();

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`SO Generator running on http://localhost:${PORT}`));
