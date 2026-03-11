const express = require('express');
const router = express.Router();
const { suggestHTS, getByCode, searchCodes, getRatesForCOO } = require('../data/hts_codes');

// GET /api/hts/search?q=belt+leather
router.get('/search', (req, res) => {
  const results = searchCodes(req.query.q || '');
  res.json(results);
});

// GET /api/hts/suggest?category=BELTS&material=leather&coo=China
router.get('/suggest', (req, res) => {
  const { category, material, coo } = req.query;
  const materials = material ? [{ material, pct: 100 }] : [];
  const results = suggestHTS(category, materials, coo);
  res.json(results);
});

// GET /api/hts/:code?coo=China
router.get('/:code', (req, res) => {
  const entry = getByCode(decodeURIComponent(req.params.code));
  if (!entry) return res.status(404).json({ error: 'HTS code not found' });
  const coo = req.query.coo || '';
  res.json({ ...entry, ...getRatesForCOO(entry, coo) });
});

module.exports = router;
