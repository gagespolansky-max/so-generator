const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

router.get('/', (req, res) => {
  try { res.json(getDb().prepare('SELECT * FROM customers ORDER BY customer_name').all()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = getDb().prepare('SELECT * FROM customers WHERE id=?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const db = getDb(); const d = req.body;
    const r = db.prepare(`
      INSERT INTO customers (customer_code,customer_name,default_ship_destination,
        nj_wh_rate,ca_wh_rate,terms_rate,notes,
        suffocation_warning,pre_ticket,pre_pack,pre_pack_label,pre_pack_details,
        cards_hangers,cards_hangers_brand,sewn_in_label,testing_required,testing_procedure,top_samples)
      VALUES (@customer_code,@customer_name,@default_ship_destination,
        @nj_wh_rate,@ca_wh_rate,@terms_rate,@notes,
        @suffocation_warning,@pre_ticket,@pre_pack,@pre_pack_label,@pre_pack_details,
        @cards_hangers,@cards_hangers_brand,@sewn_in_label,@testing_required,@testing_procedure,@top_samples)
    `).run({ customer_code:d.customer_code,customer_name:d.customer_name,
      default_ship_destination:d.default_ship_destination||'DIRECT TO L.A',
      nj_wh_rate:d.nj_wh_rate||0,ca_wh_rate:d.ca_wh_rate||0.07,terms_rate:d.terms_rate||0.053,
      notes:d.notes||'', suffocation_warning:d.suffocation_warning??1,pre_ticket:d.pre_ticket??1,
      pre_pack:d.pre_pack??1,pre_pack_label:d.pre_pack_label??0,
      pre_pack_details:d.pre_pack_details||'1 Warehouse Pack / 36 Vendor Pack',
      cards_hangers:d.cards_hangers??1,cards_hangers_brand:d.cards_hangers_brand||'',
      sewn_in_label:d.sewn_in_label??0,testing_required:d.testing_required??0,
      testing_procedure:d.testing_procedure||'',top_samples:d.top_samples??1 });
    res.status(201).json(db.prepare('SELECT * FROM customers WHERE id=?').get(r.lastInsertRowid));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const db = getDb(); const d = req.body;
    db.prepare(`
      UPDATE customers SET customer_code=@customer_code,customer_name=@customer_name,
        default_ship_destination=@default_ship_destination,
        nj_wh_rate=@nj_wh_rate,ca_wh_rate=@ca_wh_rate,terms_rate=@terms_rate,notes=@notes,
        suffocation_warning=@suffocation_warning,pre_ticket=@pre_ticket,
        pre_pack=@pre_pack,pre_pack_label=@pre_pack_label,pre_pack_details=@pre_pack_details,
        cards_hangers=@cards_hangers,cards_hangers_brand=@cards_hangers_brand,
        sewn_in_label=@sewn_in_label,testing_required=@testing_required,
        testing_procedure=@testing_procedure,top_samples=@top_samples
      WHERE id=@id
    `).run({ id:req.params.id,customer_code:d.customer_code,customer_name:d.customer_name,
      default_ship_destination:d.default_ship_destination||'DIRECT TO L.A',
      nj_wh_rate:d.nj_wh_rate||0,ca_wh_rate:d.ca_wh_rate||0.07,terms_rate:d.terms_rate||0.053,
      notes:d.notes||'', suffocation_warning:d.suffocation_warning??1,pre_ticket:d.pre_ticket??1,
      pre_pack:d.pre_pack??1,pre_pack_label:d.pre_pack_label??0,
      pre_pack_details:d.pre_pack_details||'',cards_hangers:d.cards_hangers??1,
      cards_hangers_brand:d.cards_hangers_brand||'',sewn_in_label:d.sewn_in_label??0,
      testing_required:d.testing_required??0,testing_procedure:d.testing_procedure||'',
      top_samples:d.top_samples??1 });
    res.json(db.prepare('SELECT * FROM customers WHERE id=?').get(req.params.id));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try { getDb().prepare('DELETE FROM customers WHERE id=?').run(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
