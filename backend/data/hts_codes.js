// Curated HTS codes relevant to apparel accessories (belts, jewelry, handbags)
// Duty rates = MFN Column 1. Tariff rates reflect China Section 301 + IEEPA (2025).
// For non-China COO: tariff1=0, tariff2=0, tariff3=0.

const HTS_CODES = [
  // ── Chapter 42: Leather & Travel Goods ──────────────────────────────────────
  {
    hts_code: '4203.30.00',
    description: 'Belts and bandoliers of leather or composition leather',
    chapter: 42, category_hint: ['BELTS'], material_hint: ['leather', 'pu leather', 'composition leather', 'genuine leather'],
    duty_pct: 0.027, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 2.7% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },
  {
    hts_code: '4205.00.8000',
    description: 'Other articles of leather or composition leather, not elsewhere specified',
    chapter: 42, category_hint: ['ACCESSORIES', 'HANDBAGS'], material_hint: ['leather', 'pu leather'],
    duty_pct: 0.020, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 2.0% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },
  {
    hts_code: '4202.22.4500',
    description: 'Handbags, whether or not with shoulder strap, with outer surface of leather',
    chapter: 42, category_hint: ['HANDBAGS'], material_hint: ['leather', 'pu leather'],
    duty_pct: 0.090, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 9.0% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },
  {
    hts_code: '4202.22.8100',
    description: 'Handbags with outer surface of textile materials',
    chapter: 42, category_hint: ['HANDBAGS'], material_hint: ['polyester', 'nylon', 'cotton', 'canvas'],
    duty_pct: 0.177, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 17.7% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },

  // ── Chapter 39: Plastics ─────────────────────────────────────────────────────
  {
    hts_code: '3926.20.6000',
    description: 'Belts and bandoliers of plastics',
    chapter: 39, category_hint: ['BELTS'], material_hint: ['pvc', 'plastic', 'vinyl'],
    duty_pct: 0.053, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 5.3% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },
  {
    hts_code: '3926.20.9050',
    description: 'Other articles of plastics for apparel and clothing accessories',
    chapter: 39, category_hint: ['ACCESSORIES'], material_hint: ['pvc', 'plastic', 'acrylic'],
    duty_pct: 0.053, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 5.3% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },

  // ── Chapter 40: Rubber ───────────────────────────────────────────────────────
  {
    hts_code: '4016.99.3500',
    description: 'Gaskets, washers and other seals; belts and belting of vulcanized rubber',
    chapter: 40, category_hint: ['BELTS', 'ACCESSORIES'], material_hint: ['rubber', 'elastic'],
    duty_pct: 0.025, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 2.5% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },

  // ── Chapter 61: Knitted/crocheted apparel ────────────────────────────────────
  {
    hts_code: '6117.80.1000',
    description: 'Other knitted or crocheted clothing accessories of cotton',
    chapter: 61, category_hint: ['BELTS', 'ACCESSORIES'], material_hint: ['cotton'],
    duty_pct: 0.105, tariff1_pct: 0.279, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 10.5% MFN + 27.9% Sec.301 + 20% IEEPA'
  },
  {
    hts_code: '6117.80.8500',
    description: 'Other knitted or crocheted clothing accessories of man-made fibers',
    chapter: 61, category_hint: ['BELTS', 'ACCESSORIES'], material_hint: ['polyester', 'nylon', 'spandex', 'acrylic', 'viscose'],
    duty_pct: 0.146, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 14.6% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },
  {
    hts_code: '6117.80.9500',
    description: 'Other knitted or crocheted clothing accessories of other textile materials',
    chapter: 61, category_hint: ['ACCESSORIES'], material_hint: ['wool', 'silk', 'linen'],
    duty_pct: 0.069, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 6.9% MFN + 25% Sec.301 + 20% IEEPA'
  },

  // ── Chapter 62: Woven apparel accessories ────────────────────────────────────
  {
    hts_code: '6217.10.1000',
    description: 'Clothing accessories of cotton, not knitted or crocheted',
    chapter: 62, category_hint: ['BELTS', 'ACCESSORIES'], material_hint: ['cotton', 'canvas'],
    duty_pct: 0.063, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 6.3% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },
  {
    hts_code: '6217.10.9005',
    description: 'Clothing accessories of man-made fibers, not knitted or crocheted',
    chapter: 62, category_hint: ['BELTS', 'ACCESSORIES'], material_hint: ['polyester', 'nylon', 'spandex', 'rayon', 'viscose', 'polypropylene'],
    duty_pct: 0.149, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 14.9% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },
  {
    hts_code: '6217.10.9025',
    description: 'Clothing accessories of other textile materials, not knitted or crocheted',
    chapter: 62, category_hint: ['ACCESSORIES'], material_hint: ['wool', 'silk', 'linen'],
    duty_pct: 0.078, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 7.8% MFN + 25% Sec.301 + 20% IEEPA'
  },

  // ── Chapter 63: Other textile articles ──────────────────────────────────────
  {
    hts_code: '6307.90.9891',
    description: 'Other made-up textile articles of man-made fibers',
    chapter: 63, category_hint: ['ACCESSORIES'], material_hint: ['polyester', 'nylon'],
    duty_pct: 0.070, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 7.0% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },

  // ── Chapter 71: Jewelry & precious articles ──────────────────────────────────
  {
    hts_code: '7117.19.9000',
    description: 'Imitation jewelry of base metal, not elsewhere specified',
    chapter: 71, category_hint: ['ACCESSORIES'], material_hint: ['metal', 'iron', 'brass', 'zinc', 'aluminum'],
    duty_pct: 0.110, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 11.0% MFN + 25% Sec.301 List 3 + 20% IEEPA'
  },
  {
    hts_code: '7117.90.7500',
    description: 'Imitation jewelry of other materials (plastic, glass, etc.)',
    chapter: 71, category_hint: ['ACCESSORIES'], material_hint: ['plastic', 'glass', 'resin', 'acrylic'],
    duty_pct: 0.110, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 11.0% MFN + 25% Sec.301 + 20% IEEPA'
  },
  {
    hts_code: '7113.19.5000',
    description: 'Articles of jewelry and parts thereof, of other precious metal',
    chapter: 71, category_hint: ['ACCESSORIES'], material_hint: ['silver', 'gold', 'precious metal'],
    duty_pct: 0.055, tariff1_pct: 0, tariff2_pct: 0, tariff3_pct: 0,
    notes: 'Generally exempt from Section 301'
  },

  // ── Chapter 62: Scarves / Shawls ─────────────────────────────────────────────
  {
    hts_code: '6214.30.0000',
    description: 'Shawls, scarves, mufflers, mantillas, veils of silk or silk waste',
    chapter: 62, category_hint: ['ACCESSORIES'], material_hint: ['silk'],
    duty_pct: 0.011, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 1.1% MFN + 25% Sec.301 + 20% IEEPA'
  },
  {
    hts_code: '6214.20.0000',
    description: 'Shawls, scarves of wool or fine animal hair',
    chapter: 62, category_hint: ['ACCESSORIES'], material_hint: ['wool', 'cashmere'],
    duty_pct: 0.068, tariff1_pct: 0.25, tariff2_pct: 0.20, tariff3_pct: 0,
    notes: 'China: 6.8% MFN + 25% Sec.301 + 20% IEEPA'
  },
];

// Zero out tariff rates for non-China countries
const CHINA_TARIFF_COUNTRIES = new Set(['china', 'prc', 'peoples republic of china']);

function getRatesForCOO(htsEntry, coo) {
  const cooLower = (coo || '').toLowerCase();
  if (CHINA_TARIFF_COUNTRIES.has(cooLower)) {
    return {
      duty_pct: htsEntry.duty_pct,
      tariff1_pct: htsEntry.tariff1_pct,
      tariff2_pct: htsEntry.tariff2_pct,
      tariff3_pct: htsEntry.tariff3_pct,
    };
  }
  // For non-China: only MFN duty applies
  return {
    duty_pct: htsEntry.duty_pct,
    tariff1_pct: 0,
    tariff2_pct: 0,
    tariff3_pct: 0,
  };
}

function suggestHTS(category, materials, coo) {
  // Determine primary material (highest pct) and all material names
  const matNames = (materials || [])
    .sort((a, b) => (b.pct || 0) - (a.pct || 0))
    .map(m => (m.material || '').toLowerCase());
  const primaryMat = matNames[0] || '';
  const cat = (category || '').toUpperCase();

  // Score each HTS entry
  const scored = HTS_CODES.map(h => {
    let score = 0;
    // Category match
    if (h.category_hint.includes(cat)) score += 10;
    // Primary material match
    if (h.material_hint.some(m => primaryMat.includes(m) || m.includes(primaryMat))) score += 8;
    // Any material match
    for (const mat of matNames) {
      if (h.material_hint.some(m => mat.includes(m) || m.includes(mat))) score += 2;
    }
    return { ...h, ...getRatesForCOO(h, coo), score };
  });

  return scored
    .filter(h => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function getByCode(code) {
  return HTS_CODES.find(h => h.hts_code === code) || null;
}

function searchCodes(query) {
  const q = (query || '').toLowerCase();
  return HTS_CODES.filter(h =>
    h.hts_code.toLowerCase().includes(q) ||
    h.description.toLowerCase().includes(q) ||
    h.material_hint.some(m => m.includes(q)) ||
    h.category_hint.some(c => c.toLowerCase().includes(q))
  );
}

module.exports = { HTS_CODES, suggestHTS, getByCode, searchCodes, getRatesForCOO };
