const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getDb } = require('../db/schema');

const upload = multer({ storage: multer.memoryStorage() });
const parseJson = v => { try { return JSON.parse(v || '[]'); } catch { return []; } };

function parseStyle(s) {
  return {
    ...s,
    available_colors: parseJson(s.available_colors),
    available_sizes:  parseJson(s.available_sizes),
    materials:        parseJson(s.materials),
  };
}

// GET /api/styles
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, season, category, active } = req.query;
    let q = 'SELECT * FROM styles WHERE 1=1';
    const p = [];
    if (search) { q += ' AND (style_number LIKE ? OR description LIKE ? OR brand LIKE ? OR vendor LIKE ?)'; const s=`%${search}%`; p.push(s,s,s,s); }
    if (season)   { q += ' AND season = ?';   p.push(season); }
    if (category) { q += ' AND category = ?'; p.push(category); }
    if (active !== undefined) { q += ' AND active = ?'; p.push(active === 'true' || active === '1' ? 1 : 0); }
    q += ' ORDER BY created_at DESC';
    const rows = db.prepare(q).all(...p);
    res.json(rows.map(parseStyle));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/styles/:style_number
router.get('/:style_number', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM styles WHERE style_number = ?').get(req.params.style_number);
    if (!row) return res.status(404).json({ error: 'Style not found' });
    res.json(parseStyle(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/styles
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const d = req.body;
    db.prepare(`
      INSERT INTO styles (
        style_number, description, category, brand,
        available_colors, available_sizes, materials,
        country_of_origin, hts_code,
        wholesale_price, retail_price, first_cost,
        vendor, duty_pct, tariff1_pct, tariff2_pct, tariff3_pct,
        royalty_pct, agent_fee, freight, misc, shipping_mode, season, active
      ) VALUES (
        @style_number, @description, @category, @brand,
        @available_colors, @available_sizes, @materials,
        @country_of_origin, @hts_code,
        @wholesale_price, @retail_price, @first_cost,
        @vendor, @duty_pct, @tariff1_pct, @tariff2_pct, @tariff3_pct,
        @royalty_pct, @agent_fee, @freight, @misc, @shipping_mode, @season, 1
      )
    `).run({
      style_number: d.style_number,
      description: d.description,
      category: d.category || 'ACCESSORIES',
      brand: d.brand || '',
      available_colors: JSON.stringify(d.available_colors || []),
      available_sizes:  JSON.stringify(d.available_sizes  || []),
      materials:        JSON.stringify(d.materials        || []),
      country_of_origin: d.country_of_origin || '',
      hts_code:          d.hts_code          || '',
      wholesale_price: d.wholesale_price || 0,
      retail_price:    d.retail_price    || 0,
      first_cost:      d.first_cost      || 0,
      vendor:      d.vendor      || '',
      duty_pct:    d.duty_pct    ?? 0.146,
      tariff1_pct: d.tariff1_pct ?? 0.075,
      tariff2_pct: d.tariff2_pct ?? 0.200,
      tariff3_pct: d.tariff3_pct ?? 0,
      royalty_pct: d.royalty_pct || 0,
      agent_fee:   d.agent_fee   || 0,
      freight:     d.freight     ?? 0.15,
      misc:        d.misc        ?? 0.07,
      shipping_mode: d.shipping_mode || 'BOAT',
      season: d.season || '',
    });
    const row = db.prepare('SELECT * FROM styles WHERE style_number = ?').get(d.style_number);
    res.status(201).json(parseStyle(row));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/styles/:style_number
router.put('/:style_number', (req, res) => {
  try {
    const db = getDb();
    const d = req.body;
    db.prepare(`
      UPDATE styles SET
        description=@description, category=@category, brand=@brand,
        available_colors=@available_colors, available_sizes=@available_sizes, materials=@materials,
        country_of_origin=@country_of_origin, hts_code=@hts_code,
        wholesale_price=@wholesale_price, retail_price=@retail_price, first_cost=@first_cost,
        vendor=@vendor, duty_pct=@duty_pct, tariff1_pct=@tariff1_pct,
        tariff2_pct=@tariff2_pct, tariff3_pct=@tariff3_pct,
        royalty_pct=@royalty_pct, agent_fee=@agent_fee, freight=@freight, misc=@misc,
        shipping_mode=@shipping_mode, season=@season, active=@active
      WHERE style_number=@style_number
    `).run({
      style_number: req.params.style_number,
      description: d.description,
      category: d.category || 'ACCESSORIES',
      brand: d.brand || '',
      available_colors: JSON.stringify(d.available_colors || []),
      available_sizes:  JSON.stringify(d.available_sizes  || []),
      materials:        JSON.stringify(d.materials        || []),
      country_of_origin: d.country_of_origin || '',
      hts_code:          d.hts_code          || '',
      wholesale_price: d.wholesale_price || 0,
      retail_price:    d.retail_price    || 0,
      first_cost:      d.first_cost      || 0,
      vendor:      d.vendor      || '',
      duty_pct:    d.duty_pct    ?? 0.146,
      tariff1_pct: d.tariff1_pct ?? 0.075,
      tariff2_pct: d.tariff2_pct ?? 0.200,
      tariff3_pct: d.tariff3_pct ?? 0,
      royalty_pct: d.royalty_pct || 0,
      agent_fee:   d.agent_fee   || 0,
      freight:     d.freight     ?? 0.15,
      misc:        d.misc        ?? 0.07,
      shipping_mode: d.shipping_mode || 'BOAT',
      season: d.season || '',
      active: d.active ?? 1,
    });
    const row = db.prepare('SELECT * FROM styles WHERE style_number = ?').get(req.params.style_number);
    res.json(parseStyle(row));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/styles/:style_number
router.delete('/:style_number', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE styles SET active=0 WHERE style_number=?').run(req.params.style_number);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/styles/import-xlsx
router.post('/import-xlsx', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);
    const ws = wb.worksheets[0];

    const colMap = {};
    ws.getRow(1).eachCell((cell, n) => {
      const name = String(cell.value || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      colMap[name] = n;
    });
    const get = (row, name) => {
      const idx = colMap[name]; if (!idx) return '';
      const v = row.getCell(idx).value;
      return (v === null || v === undefined) ? '' : String(v).trim();
    };
    const num = (row, name) => parseFloat(get(row, name)) || 0;

    const db = getDb();
    const upsert = db.prepare(`
      INSERT INTO styles (
        style_number, description, category, brand,
        available_colors, available_sizes, materials,
        country_of_origin, hts_code,
        wholesale_price, retail_price, first_cost,
        vendor, duty_pct, tariff1_pct, tariff2_pct, tariff3_pct,
        royalty_pct, agent_fee, freight, misc, shipping_mode, season, active
      ) VALUES (
        @style_number, @description, @category, @brand,
        @available_colors, @available_sizes, @materials,
        @country_of_origin, @hts_code,
        @wholesale_price, @retail_price, @first_cost,
        @vendor, @duty_pct, @tariff1_pct, @tariff2_pct, @tariff3_pct,
        @royalty_pct, @agent_fee, @freight, @misc, @shipping_mode, @season, 1
      )
      ON CONFLICT(style_number) DO UPDATE SET
        description=excluded.description, category=excluded.category, brand=excluded.brand,
        available_colors=excluded.available_colors, available_sizes=excluded.available_sizes,
        materials=excluded.materials, country_of_origin=excluded.country_of_origin,
        hts_code=excluded.hts_code,
        wholesale_price=excluded.wholesale_price, retail_price=excluded.retail_price,
        first_cost=excluded.first_cost, vendor=excluded.vendor,
        duty_pct=excluded.duty_pct, tariff1_pct=excluded.tariff1_pct,
        tariff2_pct=excluded.tariff2_pct, tariff3_pct=excluded.tariff3_pct,
        royalty_pct=excluded.royalty_pct, agent_fee=excluded.agent_fee,
        freight=excluded.freight, misc=excluded.misc,
        shipping_mode=excluded.shipping_mode, season=excluded.season, active=1
    `);

    let inserted = 0, updated = 0;
    const errors = [];

    const doImport = db.transaction(() => {
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
        const styleNum = get(row, 'style_number') || get(row, 'style_');
        if (!styleNum) return;
        try {
          const exists = db.prepare('SELECT 1 FROM styles WHERE style_number=?').get(styleNum.toUpperCase());
          const rawColors = get(row, 'colors') || get(row, 'available_colors') || '';
          const rawSizes  = get(row, 'sizes')  || get(row, 'available_sizes')  || '';
          const colors = rawColors ? rawColors.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [];
          const sizes  = rawSizes  ? rawSizes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [];
          let materials = [];
          const rawMats = get(row, 'materials') || '';
          if (rawMats) {
            try { materials = JSON.parse(rawMats); }
            catch { materials = rawMats.split(',').map(p => { const m = p.trim().match(/^(.+?)\s+(\d+)%?$/); return m ? { material: m[1].trim(), pct: parseInt(m[2]) } : null; }).filter(Boolean); }
          }
          upsert.run({
            style_number: styleNum.toUpperCase(),
            description: (get(row, 'description') || '').toUpperCase(),
            category: (get(row, 'category') || 'ACCESSORIES').toUpperCase(),
            brand: (get(row, 'brand') || '').toUpperCase(),
            available_colors: JSON.stringify(colors),
            available_sizes:  JSON.stringify(sizes),
            materials: JSON.stringify(materials),
            country_of_origin: get(row, 'country_of_origin') || get(row, 'coo') || '',
            hts_code: get(row, 'hts_code') || '',
            wholesale_price: num(row, 'wholesale_price'),
            retail_price:    num(row, 'retail_price'),
            first_cost:      num(row, 'first_cost'),
            vendor: (get(row, 'vendor') || '').toUpperCase(),
            duty_pct:    num(row, 'duty_pct')    || 0.146,
            tariff1_pct: num(row, 'tariff1_pct') || 0.075,
            tariff2_pct: num(row, 'tariff2_pct') || 0.200,
            tariff3_pct: num(row, 'tariff3_pct') || 0,
            royalty_pct: num(row, 'royalty_pct') || 0,
            agent_fee:   num(row, 'agent_fee')   || 0,
            freight:     num(row, 'freight')     || 0.15,
            misc:        num(row, 'misc')        || 0.07,
            shipping_mode: (get(row, 'shipping_mode') || 'BOAT').toUpperCase(),
            season: (get(row, 'season') || '').toUpperCase(),
          });
          if (exists) updated++; else inserted++;
        } catch (e) { errors.push({ row: rowNum, style: styleNum, error: e.message }); }
      });
    });
    doImport();
    res.json({ inserted, updated, errors, source: 'Design Catalog' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
