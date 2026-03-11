import React, { useState, useEffect, useRef } from 'react';
import { getStyles, createStyle, updateStyle, deleteStyle, importStylesCSV, importStylesXLSX, suggestHTS, getHTSCode } from '../services/api';

const MATERIAL_TYPES = [
  'Cotton', 'Polyester', 'Nylon', 'Spandex', 'Leather', 'PU Leather', 'PVC',
  'Rubber', 'Acrylic', 'Rayon', 'Wool', 'Silk', 'Linen', 'Metal', 'Plastic',
  'Elastic', 'Viscose', 'Polypropylene'
];

// Tag input for colors and sizes
function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState('');

  function addTag(value) {
    const trimmed = value.trim().toUpperCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag));
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border border-gray-300 rounded-md min-h-[40px] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:text-red-600 ml-0.5 leading-none"
          >×</button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 min-w-24 text-sm outline-none bg-transparent"
        value={input}
        placeholder={tags.length === 0 ? placeholder : ''}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
          } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => { if (input) addTag(input); }}
      />
    </div>
  );
}

const EMPTY_STYLE = {
  style_number: '',
  description: '',
  category: 'BELTS',
  brand: '',
  available_colors: [],
  available_sizes: [],
  materials: [],
  country_of_origin: '',
  hts_code: '',
  wholesale_price: 0,
  retail_price: 0,
  first_cost: 0,
  vendor: '',
  duty_pct: 0.146,
  tariff1_pct: 0.075,
  tariff2_pct: 0.200,
  tariff3_pct: 0,
  royalty_pct: 0,
  agent_fee: 0,
  freight: 0.15,
  misc: 0.07,
  shipping_mode: 'BOAT',
  season: '',
  active: 1
};

function StyleModal({ style, onSave, onClose }) {
  const [form, setForm] = useState(style ? { ...EMPTY_STYLE, ...style } : { ...EMPTY_STYLE });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [htsSuggestions, setHtsSuggestions] = useState([]);

  function update(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function updateMaterial(i, field, value) {
    const updated = [...(form.materials || [])];
    updated[i] = { ...updated[i], [field]: value };
    update('materials', updated);
  }

  function addMaterial() {
    update('materials', [...(form.materials || []), { material: '', pct: 0 }]);
  }

  function removeMaterial(i) {
    const updated = [...(form.materials || [])];
    updated.splice(i, 1);
    update('materials', updated);
  }

  const materialTotal = (form.materials || []).reduce((sum, m) => sum + (parseInt(m.pct) || 0), 0);

  async function handleHTSSuggest() {
    try {
      const sorted = [...(form.materials || [])].sort((a, b) => (b.pct || 0) - (a.pct || 0));
      const primaryMat = sorted[0]?.material || '';
      const suggestions = await suggestHTS({
        category: form.category,
        material: primaryMat,
        coo: form.country_of_origin
      });
      setHtsSuggestions(suggestions);
    } catch (err) {
      console.error('HTS suggest failed:', err.message);
    }
  }

  async function handleHTSSelect(code) {
    try {
      const details = await getHTSCode(encodeURIComponent(code));
      if (details) {
        update('hts_code', details.hts_code);
        update('duty_pct', details.duty_pct);
        update('tariff1_pct', details.tariff1_pct);
        update('tariff2_pct', details.tariff2_pct);
        update('tariff3_pct', details.tariff3_pct);
        setHtsSuggestions([]);
      }
    } catch (err) {
      // If COO-specific lookup fails, try without COO
      try {
        const details = await getHTSCode(code);
        if (details) {
          update('hts_code', details.hts_code);
          update('duty_pct', details.duty_pct);
          update('tariff1_pct', details.tariff1_pct);
          update('tariff2_pct', details.tariff2_pct);
          update('tariff3_pct', details.tariff3_pct);
          setHtsSuggestions([]);
        }
      } catch {
        console.error('HTS select failed:', err.message);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.style_number || !form.description) {
      setError('Style number and description are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {style ? `Edit ${style.style_number}` : 'New Style'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Style Number *</label>
              <input
                className="input"
                value={form.style_number}
                onChange={e => update('style_number', e.target.value.toUpperCase())}
                disabled={!!style}
                placeholder="e.g. TT261189"
              />
            </div>
            <div>
              <label className="label">Description *</label>
              <input
                className="input"
                value={form.description}
                onChange={e => update('description', e.target.value.toUpperCase())}
                placeholder="e.g. IRREGULAR BUCKLE BELT"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => update('category', e.target.value)}>
                <option>BELTS</option>
                <option>ACCESSORIES</option>
                <option>APPAREL</option>
                <option>HANDBAGS</option>
                <option>OTHER</option>
              </select>
            </div>
            <div>
              <label className="label">Brand</label>
              <input
                className="input"
                value={form.brand}
                onChange={e => update('brand', e.target.value.toUpperCase())}
                placeholder="e.g. TIME AND TRU"
              />
            </div>
            <div>
              <label className="label">Season</label>
              <input
                className="input"
                value={form.season}
                onChange={e => update('season', e.target.value.toUpperCase())}
                placeholder="e.g. FW25"
              />
            </div>
            <div>
              <label className="label">Vendor</label>
              <input
                className="input"
                value={form.vendor}
                onChange={e => update('vendor', e.target.value.toUpperCase())}
                placeholder="e.g. JUNBANG"
              />
            </div>
          </div>

          {/* Country of Origin */}
          <div>
            <label className="label">Country of Origin</label>
            <select className="input" value={form.country_of_origin} onChange={e => update('country_of_origin', e.target.value)}>
              <option value="">Select...</option>
              <option>China</option>
              <option>Vietnam</option>
              <option>Bangladesh</option>
              <option>Cambodia</option>
              <option>India</option>
              <option>Indonesia</option>
              <option>Mexico</option>
              <option>Pakistan</option>
              <option>Sri Lanka</option>
              <option>Turkey</option>
              <option>Other</option>
            </select>
          </div>

          {/* Material Composition */}
          <div>
            <label className="label">Material Composition</label>
            <div className="space-y-2">
              {(form.materials || []).map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    list="material-list"
                    className="input flex-1"
                    placeholder="e.g. Cotton, Polyester, Leather..."
                    value={m.material}
                    onChange={e => updateMaterial(i, 'material', e.target.value)}
                  />
                  <datalist id="material-list">
                    {MATERIAL_TYPES.map(mt => <option key={mt} value={mt} />)}
                  </datalist>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="input w-20 text-right"
                      value={m.pct}
                      onChange={e => updateMaterial(i, 'pct', parseInt(e.target.value) || 0)}
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMaterial(i)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMaterial}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Add Material
              </button>
              {materialTotal !== 100 && (form.materials || []).length > 0 && (
                <p className="text-xs text-amber-600">Total: {materialTotal}% (must equal 100%)</p>
              )}
            </div>
          </div>

          {/* HTS Classification */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">HTS Classification</h3>
            <div className="space-y-3">
              {/* HTS code input */}
              <div>
                <label className="label">HTS Code</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1 font-mono"
                    placeholder="e.g. 4203.30.00"
                    value={form.hts_code}
                    onChange={e => update('hts_code', e.target.value)}
                    onBlur={e => {
                      if (e.target.value) handleHTSSelect(e.target.value);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleHTSSuggest}
                    className="btn-secondary text-xs px-3"
                  >
                    Auto-suggest
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              {htsSuggestions.length > 0 && (
                <div className="border border-indigo-200 rounded-lg divide-y divide-gray-100 bg-white">
                  {htsSuggestions.map(h => (
                    <button
                      key={h.hts_code}
                      type="button"
                      onClick={() => handleHTSSelect(h.hts_code)}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold text-indigo-700">{h.hts_code}</span>
                        <span className="text-xs text-gray-500">Duty: {(h.duty_pct * 100).toFixed(1)}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{h.description}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setHtsSuggestions([])}
                    className="w-full text-center px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Applied rates summary */}
              {form.hts_code && (
                <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800">
                  <strong>Rates from HTS {form.hts_code}:</strong>{' '}
                  Duty {(form.duty_pct * 100).toFixed(2)}% · T1 {(form.tariff1_pct * 100).toFixed(1)}% · T2 {(form.tariff2_pct * 100).toFixed(1)}%
                  {form.tariff3_pct > 0 && ` · T3 ${(form.tariff3_pct * 100).toFixed(1)}%`}
                  <span className="text-xs text-blue-500 ml-2">(override in cost components below)</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Available Colors (press Enter to add)</label>
            <TagInput
              tags={form.available_colors}
              onChange={v => update('available_colors', v)}
              placeholder="Type color and press Enter..."
            />
          </div>

          <div>
            <label className="label">Available Sizes (press Enter to add)</label>
            <TagInput
              tags={form.available_sizes}
              onChange={v => update('available_sizes', v)}
              placeholder="Type size and press Enter..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Wholesale Price</label>
              <input type="number" step="0.01" className="input" value={form.wholesale_price}
                onChange={e => update('wholesale_price', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">Retail Price</label>
              <input type="number" step="0.01" className="input" value={form.retail_price}
                onChange={e => update('retail_price', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">1st Cost</label>
              <input type="number" step="0.01" className="input" value={form.first_cost}
                onChange={e => update('first_cost', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Cost Components</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                ['Duty %', 'duty_pct'],
                ['Tariff 1 %', 'tariff1_pct'],
                ['Tariff 2 %', 'tariff2_pct'],
                ['Tariff 3 %', 'tariff3_pct'],
                ['Royalty %', 'royalty_pct'],
                ['Agent Fee $', 'agent_fee'],
                ['Freight $', 'freight'],
                ['Misc $', 'misc']
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    type="number"
                    step="0.001"
                    className="input"
                    value={form[key]}
                    onChange={e => update(key, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
              <div>
                <label className="label">Ship Mode</label>
                <select className="input" value={form.shipping_mode} onChange={e => update('shipping_mode', e.target.value)}>
                  <option value="BOAT">BOAT</option>
                  <option value="AIR">AIR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Markup preview */}
          {form.wholesale_price > 0 && form.first_cost > 0 && (() => {
            const sell = form.wholesale_price;
            const fc = form.first_cost;
            const duty = fc * form.duty_pct;
            const tar1 = fc * form.tariff1_pct;
            const tar2 = fc * form.tariff2_pct;
            const tar3 = fc * (form.tariff3_pct || 0);
            const landed = fc + duty + tar1 + tar2 + tar3 + form.freight + form.misc;
            const markup = ((sell - landed) / sell) * 100;
            return (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="text-gray-600">Estimated Markup: </span>
                <strong className={markup >= 30 ? 'text-green-700' : 'text-yellow-700'}>
                  {markup.toFixed(1)}%
                </strong>
                <span className="text-gray-400 ml-3">(Landed: ${landed.toFixed(2)} / Sell: ${sell.toFixed(2)})</span>
              </div>
            );
          })()}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : style ? 'Update Style' : 'Create Style'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StyleCatalog() {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');
  const [editingStyle, setEditingStyle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const xlsxFileRef = useRef();

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (seasonFilter) params.season = seasonFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (activeFilter) params.active = activeFilter;
      const data = await getStyles(params);
      setStyles(data);
    } catch (err) {
      setError('Failed to load styles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, seasonFilter, categoryFilter, activeFilter]);

  async function handleSave(form) {
    if (editingStyle) {
      await updateStyle(editingStyle.style_number, form);
    } else {
      await createStyle(form);
    }
    load();
  }

  async function handleDelete(style_number) {
    if (!window.confirm(`Deactivate style ${style_number}?`)) return;
    try {
      await deleteStyle(style_number);
      load();
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await importStylesCSV(formData);
      setImportResult(result);
      load();
    } catch (err) {
      setError('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  async function handleXlsxImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await importStylesXLSX(formData);
      setImportResult({ ...result, source: 'Design Catalog' });
      load();
    } catch (err) {
      setError('Import failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  // Unique seasons for filter
  const seasons = [...new Set(styles.map(s => s.season).filter(Boolean))].sort();
  const categories = [...new Set(styles.map(s => s.category).filter(Boolean))].sort();

  // Abbreviate materials for table display
  function abbreviateMaterials(materials) {
    if (!materials || materials.length === 0) return '—';
    return materials
      .slice(0, 2)
      .map(m => {
        const name = m.material || '';
        // Shorten common names
        const abbrev = name
          .replace('Polyester', 'Poly')
          .replace('PU Leather', 'PU')
          .replace('Spandex', 'Spx')
          .replace('Cotton', 'Ctn');
        return `${abbrev} ${m.pct}%`;
      })
      .join(', ') + (materials.length > 2 ? '…' : '');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Style Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">{styles.length} styles</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Hidden file inputs */}
          <input type="file" ref={xlsxFileRef} className="hidden" accept=".xlsx,.xls" onChange={handleXlsxImport} />
          <input type="file" ref={fileRef} className="hidden" accept=".csv" onChange={handleImport} />

          {/* Prominent Design Catalog import */}
          <button
            onClick={() => xlsxFileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-60"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {importing ? 'Importing…' : 'Import Design Catalog'}
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="btn-secondary text-sm"
          >
            Import CSV
          </button>
          <button
            onClick={() => { setEditingStyle(null); setShowModal(true); }}
            className="btn-primary"
          >
            + New Style
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2">×</button>
        </div>
      )}

      {importResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          {importResult.source ? `${importResult.source} imported — ` : 'Import complete: '}{importResult.inserted} styles added, {importResult.updated} updated
          {importResult.errors?.length > 0 && (
            <span className="text-red-600 ml-2">, {importResult.errors.length} errors</span>
          )}
          <button onClick={() => setImportResult(null)} className="ml-2">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          className="input max-w-xs"
          placeholder="Search style#, description, brand..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-36" value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)}>
          <option value="">All Seasons</option>
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input w-36" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input w-28" value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : styles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">👗</div>
            <div className="text-lg font-medium mb-1">No styles found</div>
            <div className="text-sm">Try adjusting your search or import a CSV</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Style #</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Brand</th>
                  <th className="px-4 py-3 text-left">Season</th>
                  <th className="px-4 py-3 text-left">COO</th>
                  <th className="px-4 py-3 text-left">HTS</th>
                  <th className="px-4 py-3 text-left">Materials</th>
                  <th className="px-4 py-3 text-right">Wholesale</th>
                  <th className="px-4 py-3 text-right">1st Cost</th>
                  <th className="px-4 py-3 text-right">Duty</th>
                  <th className="px-4 py-3 text-right">T1</th>
                  <th className="px-4 py-3 text-right">T2</th>
                  <th className="px-4 py-3 text-right">T3</th>
                  <th className="px-4 py-3 text-right">Royalty</th>
                  <th className="px-4 py-3 text-right">Misc</th>
                  <th className="px-4 py-3 text-right">Agent</th>
                  <th className="px-4 py-3 text-right">Freight</th>
                  <th className="px-4 py-3 text-right">Markup %</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {styles.map(style => {
                  const markup = style.wholesale_price > 0
                    ? ((style.wholesale_price - style.first_cost) / style.wholesale_price) * 100
                    : null;
                  return (
                    <tr key={style.style_number} className="hover:bg-gray-50">
                      <td className="table-cell font-mono font-semibold text-indigo-700">
                        {style.style_number}
                      </td>
                      <td className="table-cell max-w-xs truncate">{style.description}</td>
                      <td className="table-cell text-gray-500 text-xs">{style.category}</td>
                      <td className="table-cell text-gray-500 text-xs">{style.brand}</td>
                      <td className="table-cell">
                        {style.season && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {style.season}
                          </span>
                        )}
                      </td>
                      <td className="table-cell text-xs text-gray-500">
                        {style.country_of_origin || '—'}
                      </td>
                      <td className="table-cell">
                        {style.hts_code ? (
                          <span className="font-mono text-xs text-gray-600">{style.hts_code}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="table-cell text-xs text-gray-500 max-w-[140px]">
                        {abbreviateMaterials(style.materials)}
                      </td>
                      <td className="table-cell text-right font-medium">
                        ${style.wholesale_price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="table-cell text-right text-gray-500">
                        ${style.first_cost?.toFixed(2) || '0.00'}
                      </td>
                      <td className="table-cell text-right text-xs text-gray-600">
                        {style.duty_pct ? `${(style.duty_pct * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="table-cell text-right text-xs text-gray-600">
                        {style.tariff1_pct ? `${(style.tariff1_pct * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="table-cell text-right text-xs text-gray-600">
                        {style.tariff2_pct ? `${(style.tariff2_pct * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="table-cell text-right text-xs text-gray-600">
                        {style.tariff3_pct ? `${(style.tariff3_pct * 100).toFixed(1)}%` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell text-right text-xs text-gray-600">
                        {style.royalty_pct ? `${(style.royalty_pct * 100).toFixed(1)}%` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell text-right text-xs text-gray-600">
                        {style.misc ? `${(style.misc * 100).toFixed(1)}%` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell text-right text-xs text-gray-600">
                        {style.agent_fee ? `$${style.agent_fee.toFixed(2)}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell text-right text-xs text-gray-600">
                        {style.freight ? `${(style.freight * 100).toFixed(1)}%` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell text-right">
                        {markup !== null ? (
                          <span className={`font-medium ${markup >= 50 ? 'text-green-700' : markup >= 30 ? 'text-yellow-700' : 'text-red-600'}`}>
                            {markup.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`w-2 h-2 rounded-full inline-block ${style.active ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingStyle(style); setShowModal(true); }}
                            className="px-2.5 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            Edit
                          </button>
                          {style.active ? (
                            <button
                              onClick={() => handleDelete(style.style_number)}
                              className="px-2.5 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 px-2">Inactive</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <StyleModal
          style={editingStyle}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingStyle(null); }}
        />
      )}
    </div>
  );
}
