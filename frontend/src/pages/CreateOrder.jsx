import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomers, getStyles, getOrder, getOrders, createOrder, updateOrder, exportOrder, updateOrderStatus, getOrderChanges } from '../services/api';

// ── Week number utility ──────────────────────────────────────────────────────
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatDateWithWeek(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return dateStr;
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const yr = d.getFullYear();
    const wk = getWeekNumber(d);
    return `${m}/${day}/${yr} (WK ${wk})`;
  } catch { return dateStr; }
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ currentStep, steps, onStepClick }) {
  return (
    <nav className="flex items-center space-x-2 mb-6">
      {steps.map((step, idx) => {
        const num = idx + 1;
        const isActive = num === currentStep;
        const isComplete = num < currentStep;
        return (
          <React.Fragment key={num}>
            <button
              onClick={() => onStepClick(num)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive ? 'bg-indigo-600 text-white shadow-sm' :
                isComplete ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer' :
                'bg-gray-100 text-gray-400 cursor-pointer hover:bg-gray-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive ? 'bg-white text-indigo-600' :
                isComplete ? 'bg-indigo-600 text-white' :
                'bg-gray-300 text-gray-500'
              }`}>
                {isComplete ? '✓' : num}
              </span>
              {step}
            </button>
            {idx < steps.length - 1 && (
              <span className="text-gray-300 text-xs">›</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
          value ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}

// ── Style Group Card (size run) ───────────────────────────────────────────────
function StyleGroupCard({ group, index, styles, onUpdate, onRemove }) {
  const [styleSearch, setStyleSearch] = useState(group.style_number || '');
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const searchRef = useRef(null);

  const filteredStyles = styles.filter(s =>
    s.active !== 0 && (
      s.style_number.toLowerCase().includes(styleSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(styleSearch.toLowerCase())
    )
  ).slice(0, 12);

  const selectedStyle = styles.find(s => s.style_number === group.style_number);

  // Totals for this group
  const totalQty = Object.values(group.sizes).reduce((a, v) => a + (parseInt(v) || 0), 0);
  const extSell = totalQty * (parseFloat(group.sell_price) || 0);
  const fc = parseFloat(group.first_cost) || 0;
  const duty = fc * (parseFloat(group.duty_pct) || 0.146);
  const tar1 = fc * (parseFloat(group.tariff1_pct) || 0.075);
  const tar2 = fc * (parseFloat(group.tariff2_pct) || 0.200);
  const freight = parseFloat(group.freight) || 0.15;
  const misc = parseFloat(group.misc) || 0.07;
  const sell = parseFloat(group.sell_price) || 0;
  const terms = sell * (parseFloat(group.terms_rate) || 0.053);
  const landed = fc + duty + tar1 + tar2 + freight + misc + (sell * (parseFloat(group.royalty_pct) || 0)) + terms;
  const markup = sell > 0 ? ((sell - landed) / sell) * 100 : 0;

  function selectStyle(style) {
    setStyleSearch(style.style_number);
    setShowStyleDropdown(false);
    // Pre-fill from style defaults
    onUpdate(index, {
      style_number: style.style_number,
      description: style.description,
      available_sizes: style.available_sizes || [],
      available_colors: style.available_colors || [],
      color: group.color || '',
      sell_price: style.wholesale_price || 0,
      retail_price: style.retail_price || 0,
      first_cost: style.first_cost || 0,
      vendor: style.vendor || '',
      duty_pct: style.duty_pct,
      tariff1_pct: style.tariff1_pct,
      tariff2_pct: style.tariff2_pct,
      royalty_pct: style.royalty_pct,
      freight: style.freight,
      misc: style.misc,
      shipping_mode: style.shipping_mode || 'BOAT',
      sizes: {}
    });
  }

  return (
    <div className="card p-4 relative">
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
        title="Remove style"
      >
        ×
      </button>

      <div className="grid grid-cols-12 gap-3 mb-3">
        {/* Style search */}
        <div className="col-span-4 relative" ref={searchRef}>
          <label className="label">Style #</label>
          <input
            type="text"
            className="input"
            value={styleSearch}
            placeholder="Search style..."
            onChange={e => {
              setStyleSearch(e.target.value);
              setShowStyleDropdown(true);
            }}
            onFocus={() => setShowStyleDropdown(true)}
            onBlur={() => setTimeout(() => setShowStyleDropdown(false), 150)}
          />
          {showStyleDropdown && filteredStyles.length > 0 && (
            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-56 overflow-y-auto">
              {filteredStyles.map(s => (
                <button
                  key={s.style_number}
                  type="button"
                  onMouseDown={() => selectStyle(s)}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm"
                >
                  <span className="font-medium text-gray-900">{s.style_number}</span>
                  <span className="text-gray-500 ml-2 text-xs">{s.description}</span>
                  {s.brand && <span className="text-indigo-500 ml-1 text-xs">· {s.brand}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description (read-only) */}
        <div className="col-span-5">
          <label className="label">Description</label>
          <input
            type="text"
            className="input bg-gray-50"
            value={group.description || ''}
            readOnly
            placeholder="Select a style..."
          />
        </div>

        {/* Color dropdown */}
        <div className="col-span-3">
          <label className="label">Color</label>
          <select
            className="input"
            value={group.color || ''}
            onChange={e => onUpdate(index, { color: e.target.value })}
          >
            <option value="">Select color...</option>
            {(group.available_colors || []).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Size Run Grid — the key feature */}
      {selectedStyle && (group.available_sizes || []).length > 0 && (
        <div className="mb-3">
          <label className="label">Size Run (enter quantities)</label>
          <div className="flex flex-wrap gap-2 items-end p-3 bg-gray-50 rounded-md border border-gray-200">
            {(group.available_sizes || []).map((size, si) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{size}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="size-input"
                  value={group.sizes[size] || ''}
                  placeholder="0"
                  onChange={e => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                    onUpdate(index, {
                      sizes: { ...group.sizes, [size]: val }
                    });
                  }}
                  onKeyDown={e => {
                    // Tab to next size input
                    if (e.key === 'Tab' && !e.shiftKey && si === (group.available_sizes.length - 1)) {
                      // last size — let natural tab take over
                    }
                  }}
                />
              </div>
            ))}
            {totalQty > 0 && (
              <div className="flex flex-col items-center gap-1 ml-2 pl-2 border-l border-gray-300">
                <span className="text-xs text-gray-500 font-medium">TOTAL</span>
                <span className="text-sm font-bold text-indigo-700 h-8 flex items-center">{totalQty.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing and details row */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-2">
          <label className="label">Sell Price</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={group.sell_price || ''}
            onChange={e => onUpdate(index, { sell_price: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Retail Price</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={group.retail_price || ''}
            onChange={e => onUpdate(index, { retail_price: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="col-span-2">
          <label className="label">1st Cost</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={group.first_cost || ''}
            onChange={e => onUpdate(index, { first_cost: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="col-span-1">
          <label className="label">PPK/CTG</label>
          <input
            type="number"
            step="1"
            className="input"
            value={group.ppk_ctg || ''}
            onChange={e => onUpdate(index, { ppk_ctg: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="col-span-2">
          <label className="label">VPO #</label>
          <input
            type="text"
            className="input"
            value={group.vpo_number || ''}
            onChange={e => onUpdate(index, { vpo_number: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Vendor</label>
          <input
            type="text"
            className="input"
            value={group.vendor || ''}
            onChange={e => onUpdate(index, { vendor: e.target.value })}
          />
        </div>
        <div className="col-span-1">
          <label className="label">Mode</label>
          <select
            className="input"
            value={group.shipping_mode || 'BOAT'}
            onChange={e => onUpdate(index, { shipping_mode: e.target.value })}
          >
            <option value="BOAT">BOAT</option>
            <option value="AIR">AIR</option>
          </select>
        </div>
      </div>

      {/* Remarks */}
      <div className="mt-3">
        <label className="label">Remarks</label>
        <input
          type="text"
          className="input"
          value={group.remarks || ''}
          placeholder="Optional remarks..."
          onChange={e => onUpdate(index, { remarks: e.target.value })}
        />
      </div>

      {/* Group totals */}
      {totalQty > 0 && (
        <div className="mt-3 flex gap-4 text-xs bg-indigo-50 px-3 py-2 rounded border border-indigo-100">
          <span className="text-gray-600">Qty: <strong className="text-gray-900">{totalQty.toLocaleString()}</strong></span>
          <span className="text-gray-600">Ext Sell: <strong className="text-gray-900">${extSell.toFixed(2)}</strong></span>
          <span className="text-gray-600">Landed: <strong className="text-gray-900">${landed.toFixed(2)}</strong></span>
          <span className={`text-gray-600`}>
            Markup: <strong className={markup >= 30 ? 'text-green-700' : markup >= 0 ? 'text-yellow-700' : 'text-red-700'}>
              {markup.toFixed(1)}%
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Step 1: Header Info ───────────────────────────────────────────────────────
function Step1({ form, setForm, customers, existingOrders }) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  const selectedCustomer = customers.find(c => c.id === form.customer_id);
  const displayCustomer = selectedCustomer
    ? `${selectedCustomer.customer_name} (${selectedCustomer.customer_code})`
    : customerSearch;

  const filtered = customers.filter(c =>
    c.customer_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(customerSearch.toLowerCase())
  );

  function selectCustomer(c) {
    setCustomerSearch(`${c.customer_name} (${c.customer_code})`);
    setShowCustDropdown(false);
    setForm(prev => ({
      ...prev,
      customer_id: c.id,
      nj_wh_rate: c.nj_wh_rate,
      ca_wh_rate: c.ca_wh_rate,
      terms_rate: c.terms_rate,
      // Apply compliance defaults
      suffocation_warning: c.suffocation_warning ?? 1,
      pre_ticket: c.pre_ticket ?? 1,
      pre_pack: c.pre_pack ?? 1,
      pre_pack_label: c.pre_pack_label ?? 0,
      pre_pack_details: c.pre_pack_details || '1 Warehouse Pack / 36 Vendor Pack',
      cards_hangers: c.cards_hangers ?? 1,
      cards_hangers_brand: c.cards_hangers_brand || '',
      sewn_in_label: c.sewn_in_label ?? 0,
      testing_required: c.testing_required ?? 0,
      testing_procedure: c.testing_procedure || '',
      top_samples: c.top_samples ?? 1,
      // Ship destination
      ship_direct_nj: c.default_ship_destination === 'DIRECT TO N.J' ? 1 : 0,
      ship_direct_la: c.default_ship_destination === 'DIRECT TO L.A' ? 1 : 0,
      ship_fob_dtc: c.default_ship_destination === 'FOB / DTC' ? 1 : 0
    }));
  }

  function handleCancelDateChange(e) {
    const val = e.target.value;
    setForm(prev => ({ ...prev, cancel_date: val }));
  }

  function handleCancelDateBlur(e) {
    const val = e.target.value;
    // If looks like a date, auto-format with week
    if (val && !val.includes('WK') && val.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      try {
        const parts = val.split('/');
        const d = new Date(parts[2], parts[0] - 1, parts[1]);
        if (!isNaN(d)) {
          setForm(prev => ({ ...prev, cancel_date: formatDateWithWeek(d.toISOString().split('T')[0]) }));
        }
      } catch {}
    }
  }

  // Next SO number suggestion
  const maxSO = existingOrders.reduce((max, o) => {
    const n = parseInt(o.so_number);
    return !isNaN(n) && n > max ? n : max;
  }, 5973800);
  const suggestedSO = (maxSO + 1).toString();

  const salespersonSuggestions = [...new Set(existingOrders.map(o => o.salesperson).filter(Boolean))];
  const enteredBySuggestions = [...new Set(existingOrders.map(o => o.entered_by).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Header</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {/* Customer */}
          <div className="relative">
            <label className="label">Customer *</label>
            <input
              type="text"
              className="input"
              value={selectedCustomer ? `${selectedCustomer.customer_name} (${selectedCustomer.customer_code})` : customerSearch}
              placeholder="Search customer..."
              onChange={e => {
                setCustomerSearch(e.target.value);
                setShowCustDropdown(true);
                if (!e.target.value) setForm(prev => ({ ...prev, customer_id: null }));
              }}
              onFocus={() => setShowCustDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustDropdown(false), 150)}
            />
            {showCustDropdown && filtered.length > 0 && (
              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selectCustomer(c)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm"
                  >
                    <span className="font-medium">{c.customer_name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{c.customer_code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SO Number */}
          <div>
            <label className="label">SO # <span className="text-gray-400 font-normal">(suggested: {suggestedSO})</span></label>
            <input
              type="text"
              className="input"
              value={form.so_number}
              onChange={e => setForm(prev => ({ ...prev, so_number: e.target.value }))}
              placeholder={suggestedSO}
            />
          </div>

          {/* Log Number */}
          <div>
            <label className="label">Log #</label>
            <input
              type="text"
              className="input"
              value={form.log_number}
              onChange={e => setForm(prev => ({ ...prev, log_number: e.target.value }))}
            />
          </div>

          {/* PO Number */}
          <div>
            <label className="label">PO #</label>
            <input
              type="text"
              className="input"
              value={form.po_number}
              onChange={e => setForm(prev => ({ ...prev, po_number: e.target.value }))}
            />
          </div>

          {/* Salesperson */}
          <div>
            <label className="label">Salesperson</label>
            <input
              type="text"
              list="salesperson-list"
              className="input"
              value={form.salesperson}
              onChange={e => setForm(prev => ({ ...prev, salesperson: e.target.value }))}
            />
            <datalist id="salesperson-list">
              {salespersonSuggestions.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Entered By */}
          <div>
            <label className="label">Entered By</label>
            <input
              type="text"
              list="entered-by-list"
              className="input"
              value={form.entered_by}
              onChange={e => setForm(prev => ({ ...prev, entered_by: e.target.value }))}
            />
            <datalist id="entered-by-list">
              {enteredBySuggestions.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Order Date */}
          <div>
            <label className="label">Order Date</label>
            <input
              type="date"
              className="input"
              value={form.order_date}
              onChange={e => setForm(prev => ({ ...prev, order_date: e.target.value }))}
            />
          </div>

          {/* Ship Date */}
          <div>
            <label className="label">Ship Date</label>
            <input
              type="date"
              className="input"
              value={form.ship_date}
              onChange={e => setForm(prev => ({ ...prev, ship_date: e.target.value }))}
            />
          </div>

          {/* Cancel Date */}
          <div>
            <label className="label">Cancel Date</label>
            <input
              type="text"
              className="input"
              value={form.cancel_date}
              onChange={handleCancelDateChange}
              onBlur={handleCancelDateBlur}
              placeholder="e.g. 1/23/2026 (WK 51)"
            />
            {form.ship_date && (
              <p className="text-xs text-gray-400 mt-1">
                Suggested: {formatDateWithWeek(form.ship_date)}
              </p>
            )}
          </div>

          {/* MABD */}
          <div>
            <label className="label">MABD</label>
            <input
              type="text"
              className="input"
              value={form.mabd}
              onChange={e => setForm(prev => ({ ...prev, mabd: e.target.value }))}
              placeholder="e.g. 1/23/2026 (WK 51)"
            />
          </div>
        </div>
      </div>

      {/* Rate info card (shown when customer selected) */}
      {selectedCustomer && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-2">Customer Rates</h3>
          <div className="flex gap-6 text-sm">
            <span className="text-indigo-700">NJ WH: <strong>{(form.nj_wh_rate * 100).toFixed(1)}%</strong></span>
            <span className="text-indigo-700">CA WH: <strong>{(form.ca_wh_rate * 100).toFixed(1)}%</strong></span>
            <span className="text-indigo-700">Terms: <strong>{(form.terms_rate * 100).toFixed(1)}%</strong></span>
            <span className="text-indigo-700">Ship To: <strong>{selectedCustomer.default_ship_destination}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Line Items ────────────────────────────────────────────────────────
function Step2({ styleGroups, setStyleGroups, styles, form }) {
  function addGroup() {
    setStyleGroups(prev => [...prev, {
      id: Date.now(),
      style_number: '',
      description: '',
      available_sizes: [],
      available_colors: [],
      color: '',
      sizes: {},
      sell_price: 0,
      retail_price: 0,
      first_cost: 0,
      ppk_ctg: 0,
      vpo_number: '',
      vendor: '',
      shipping_mode: 'BOAT',
      remarks: '',
      duty_pct: 0.146,
      tariff1_pct: 0.075,
      tariff2_pct: 0.200,
      royalty_pct: 0,
      freight: 0.15,
      misc: 0.07,
      terms_rate: form.terms_rate || 0.053
    }]);
  }

  function updateGroup(index, changes) {
    setStyleGroups(prev => prev.map((g, i) => i === index ? { ...g, ...changes } : g));
  }

  function removeGroup(index) {
    setStyleGroups(prev => prev.filter((_, i) => i !== index));
  }

  // Summary stats
  const totalLines = styleGroups.reduce((acc, g) => {
    return acc + Object.values(g.sizes).filter(v => (parseInt(v) || 0) > 0).length;
  }, 0);
  const totalUnits = styleGroups.reduce((acc, g) => {
    return acc + Object.values(g.sizes).reduce((s, v) => s + (parseInt(v) || 0), 0);
  }, 0);
  const totalSell = styleGroups.reduce((acc, g) => {
    const qty = Object.values(g.sizes).reduce((s, v) => s + (parseInt(v) || 0), 0);
    return acc + qty * (parseFloat(g.sell_price) || 0);
  }, 0);

  // Blended markup (simplified)
  const totalLanded = styleGroups.reduce((acc, g) => {
    const fc = parseFloat(g.first_cost) || 0;
    const duty = fc * (parseFloat(g.duty_pct) || 0.146);
    const tar1 = fc * (parseFloat(g.tariff1_pct) || 0.075);
    const tar2 = fc * (parseFloat(g.tariff2_pct) || 0.200);
    const freight = parseFloat(g.freight) || 0.15;
    const misc = parseFloat(g.misc) || 0.07;
    const sell = parseFloat(g.sell_price) || 0;
    const terms = sell * (parseFloat(g.terms_rate || form.terms_rate) || 0.053);
    const unitLanded = fc + duty + tar1 + tar2 + freight + misc + terms;
    const qty = Object.values(g.sizes).reduce((s, v) => s + (parseInt(v) || 0), 0);
    return acc + qty * unitLanded;
  }, 0);

  const blendedMarkup = totalSell > 0 ? ((totalSell - totalLanded) / totalSell) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
        <button type="button" onClick={addGroup} className="btn-primary">
          + Add Style
        </button>
      </div>

      {/* Running summary */}
      {(totalUnits > 0 || styleGroups.length > 0) && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalLines}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Lines</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalUnits.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Units</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">${totalSell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Sell $</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${blendedMarkup >= 30 ? 'text-green-700' : blendedMarkup >= 0 ? 'text-yellow-700' : 'text-red-700'}`}>
              {blendedMarkup.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Blended Markup</div>
          </div>
        </div>
      )}

      {styleGroups.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">📦</div>
          <div className="text-lg font-medium mb-1">No styles added yet</div>
          <div className="text-sm mb-4">Click "Add Style" to start building your order</div>
          <button type="button" onClick={addGroup} className="btn-primary">
            + Add First Style
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {styleGroups.map((group, idx) => (
            <StyleGroupCard
              key={group.id}
              group={group}
              index={idx}
              styles={styles}
              onUpdate={updateGroup}
              onRemove={removeGroup}
            />
          ))}
          <button type="button" onClick={addGroup} className="btn-secondary w-full">
            + Add Another Style
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Compliance ────────────────────────────────────────────────────────
function Step3({ form, setForm }) {
  function update(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  const leftItems = [
    {
      key: 'suffocation_warning',
      label: 'SUFFOCATION WARNING',
      note: 'Warning in English & Spanish Required',
      noteKey: null
    },
    { key: 'pre_ticket', label: 'PRE-TICKET' },
    {
      key: 'pre_pack',
      label: 'PRE-PACK',
      noteKey: 'pre_pack_details',
      notePlaceholder: '1 Warehouse Pack / 36 Vendor Pack'
    },
    { key: 'pre_pack_label', label: 'PRE-PACK LABEL' },
    {
      key: 'cards_hangers',
      label: 'CARDS/HANGERS',
      noteKey: 'cards_hangers_brand',
      notePlaceholder: 'Brand name...'
    },
    { key: 'sewn_in_label', label: 'SEWN IN LABEL' },
    {
      key: 'testing_required',
      label: 'TESTING REQUIRED',
      noteKey: 'testing_procedure',
      notePlaceholder: 'Procedure details...'
    }
  ];

  const rightItems = [
    { key: 'ship_direct_nj', label: 'DIRECT TO N.J' },
    { key: 'ship_direct_la', label: 'DIRECT TO L.A' },
    { key: 'ship_fob_dtc', label: 'FOB / DTC' },
    { key: 'in_stock_order', label: 'IN STOCK ORDER' },
    { key: 'closeout_order', label: 'CLOSEOUT ORDER' },
    { key: 'top_samples', label: 'TOP SAMPLES' },
    { key: 'pre_production_samples', label: 'PRE-PRODUCTION SAMPLES' }
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance & Shipping</h2>
      <div className="grid grid-cols-2 gap-8">
        {/* Left column */}
        <div className="card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Compliance</h3>
          {leftItems.map(item => (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <Toggle
                  value={!!form[item.key]}
                  onChange={v => update(item.key, v ? 1 : 0)}
                />
              </div>
              {item.note && (
                <p className="text-xs text-gray-400">{item.note}</p>
              )}
              {item.noteKey && !!form[item.key] && (
                <input
                  type="text"
                  className="input text-xs"
                  value={form[item.noteKey] || ''}
                  placeholder={item.notePlaceholder}
                  onChange={e => update(item.noteKey, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Shipping Destination</h3>
          {rightItems.map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <Toggle
                value={!!form[item.key]}
                onChange={v => update(item.key, v ? 1 : 0)}
              />
            </div>
          ))}

          <div className="pt-2 border-t border-gray-200 space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Other Notes</h3>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.other_notes || ''}
              placeholder="Other/Specify notes..."
              onChange={e => update('other_notes', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Review & Export ───────────────────────────────────────────────────
function Step4({ form, styleGroups, customers, savedOrderId, onSave, onExport, onStatusChange, saving, exporting }) {
  const customer = customers.find(c => c.id === form.customer_id);
  const [changeHistory, setChangeHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (savedOrderId) {
      getOrderChanges(savedOrderId)
        .then(data => setChangeHistory(data || []))
        .catch(() => setChangeHistory([]));
    }
  }, [savedOrderId]);

  // Flatten style groups to lines for review
  const lines = [];
  let lineNum = 1;
  for (const g of styleGroups) {
    for (const [size, qty] of Object.entries(g.sizes)) {
      const q = parseInt(qty) || 0;
      if (q > 0) {
        lines.push({ ...g, size, qty: q, line_number: lineNum++ });
      }
    }
  }

  const totalQty = lines.reduce((a, l) => a + l.qty, 0);
  const totalSell = lines.reduce((a, l) => a + l.qty * (parseFloat(l.sell_price) || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Review & Export</h2>

      {/* Header summary */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Summary</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Customer:</span>
            <div className="font-medium">{customer ? `${customer.customer_name}` : '—'}</div>
          </div>
          <div>
            <span className="text-gray-500">SO #:</span>
            <div className="font-medium">{form.so_number || '—'}</div>
          </div>
          <div>
            <span className="text-gray-500">PO #:</span>
            <div className="font-medium">{form.po_number || '—'}</div>
          </div>
          <div>
            <span className="text-gray-500">Log #:</span>
            <div className="font-medium">{form.log_number || '—'}</div>
          </div>
          <div>
            <span className="text-gray-500">Salesperson:</span>
            <div className="font-medium">{form.salesperson || '—'}</div>
          </div>
          <div>
            <span className="text-gray-500">Order Date:</span>
            <div className="font-medium">{form.order_date || '—'}</div>
          </div>
          <div>
            <span className="text-gray-500">Ship Date:</span>
            <div className="font-medium">{form.ship_date || '—'}</div>
          </div>
          <div>
            <span className="text-gray-500">Cancel Date:</span>
            <div className="font-medium">{form.cancel_date || '—'}</div>
          </div>
        </div>
      </div>

      {/* Lines table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">{lines.length} Lines · {totalQty.toLocaleString()} Units · ${totalSell.toFixed(2)}</h3>
        </div>
        {lines.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">No lines added</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Style</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Color</th>
                  <th className="px-3 py-2 text-left">Size</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Sell</th>
                  <th className="px-3 py-2 text-right">Ext Sell</th>
                  <th className="px-3 py-2 text-left">VPO #</th>
                  <th className="px-3 py-2 text-left">Vendor</th>
                  <th className="px-3 py-2 text-left">Mode</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {lines.map((line, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-cell text-gray-400">{line.line_number}</td>
                    <td className="table-cell font-mono text-xs">{line.style_number}</td>
                    <td className="table-cell max-w-xs truncate">{line.description}</td>
                    <td className="table-cell">{line.color}</td>
                    <td className="table-cell">{line.size}</td>
                    <td className="table-cell text-right font-medium">{line.qty}</td>
                    <td className="table-cell text-right">${(parseFloat(line.sell_price) || 0).toFixed(2)}</td>
                    <td className="table-cell text-right font-medium">${(line.qty * (parseFloat(line.sell_price) || 0)).toFixed(2)}</td>
                    <td className="table-cell text-gray-500">{line.vpo_number}</td>
                    <td className="table-cell text-gray-500">{line.vendor}</td>
                    <td className="table-cell">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${line.shipping_mode === 'AIR' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {line.shipping_mode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">TOTAL</td>
                  <td className="px-3 py-2 text-right text-sm font-bold">{totalQty.toLocaleString()}</td>
                  <td></td>
                  <td className="px-3 py-2 text-right text-sm font-bold">${totalSell.toFixed(2)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      {lines.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Cost Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Sell</span>
              <span className="font-medium">${totalSell.toFixed(2)}</span>
            </div>
            {form.terms_rate > 0 && (
              <div className="flex justify-between text-orange-700">
                <span>Customer Terms ({(form.terms_rate * 100).toFixed(1)}% of sell)</span>
                <span>−${(totalSell * form.terms_rate).toFixed(2)}</span>
              </div>
            )}
            {form.ship_direct_nj && form.nj_wh_rate > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>
                  NJ Warehouse ({(form.nj_wh_rate * 100).toFixed(1)}% of 1st cost)
                </span>
                <span>
                  −${lines.reduce((acc, l) => acc + l.qty * (parseFloat(l.first_cost) || 0) * form.nj_wh_rate, 0).toFixed(2)}
                </span>
              </div>
            )}
            {form.ship_direct_la && form.ca_wh_rate > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>
                  CA Warehouse ({(form.ca_wh_rate * 100).toFixed(1)}% of 1st cost)
                </span>
                <span>
                  −${lines.reduce((acc, l) => acc + l.qty * (parseFloat(l.first_cost) || 0) * form.ca_wh_rate, 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
              <span className="text-gray-700">Net After Deductions</span>
              <span className={
                (totalSell
                  - totalSell * (form.terms_rate || 0)
                  - (form.ship_direct_nj ? lines.reduce((acc, l) => acc + l.qty * (parseFloat(l.first_cost) || 0) * (form.nj_wh_rate || 0), 0) : 0)
                  - (form.ship_direct_la ? lines.reduce((acc, l) => acc + l.qty * (parseFloat(l.first_cost) || 0) * (form.ca_wh_rate || 0), 0) : 0)
                ) > 0 ? 'text-green-700' : 'text-red-700'
              }>
                ${(
                  totalSell
                  - totalSell * (form.terms_rate || 0)
                  - (form.ship_direct_nj ? lines.reduce((acc, l) => acc + l.qty * (parseFloat(l.first_cost) || 0) * (form.nj_wh_rate || 0), 0) : 0)
                  - (form.ship_direct_la ? lines.reduce((acc, l) => acc + l.qty * (parseFloat(l.first_cost) || 0) * (form.ca_wh_rate || 0), 0) : 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>
          {(form.ship_direct_nj || form.ship_direct_la) && (
            <p className="mt-3 text-xs text-gray-400">Warehouse rates set by admin · go to Admin → Customer Rates to update</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        {savedOrderId ? (
          <>
            <button
              type="button"
              onClick={onExport}
              disabled={exporting || lines.length === 0}
              className="btn-green flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Generating...
                </>
              ) : (
                <> Export Excel</>
              )}
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('confirmed')}
              disabled={form.status === 'confirmed' || form.status === 'exported'}
              className="btn-secondary"
            >
              Mark Confirmed
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => onSave('draft')}
          disabled={saving}
          className="btn-secondary flex items-center gap-2"
        >
          {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
          Save Draft
        </button>
        {!savedOrderId && <span className="text-xs text-gray-400">Save first to enable export</span>}
      </div>

      {/* Change History */}
      {savedOrderId && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen(h => !h)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
          >
            <span>Change History {changeHistory.length > 0 ? `(${changeHistory.length})` : ''}</span>
            <span className="text-gray-400">{historyOpen ? '▲' : '▼'}</span>
          </button>
          {historyOpen && (
            <div className="divide-y divide-gray-100">
              {changeHistory.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-400 text-center">No changes recorded yet</div>
              ) : (
                changeHistory.map((entry) => {
                  const dt = new Date(entry.changed_at);
                  const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={entry.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{entry.changed_by}</span>
                        <span className="text-xs text-gray-400">{dateStr} {timeStr}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{entry.summary}</p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main CreateOrder Component ────────────────────────────────────────────────
export default function CreateOrder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [existingOrders, setExistingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState(isEdit ? parseInt(id) : null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    so_number: '',
    log_number: '',
    po_number: '',
    customer_id: null,
    salesperson: '',
    entered_by: '',
    order_date: new Date().toISOString().split('T')[0],
    ship_date: '',
    cancel_date: '',
    mabd: '',
    status: 'draft',
    // Rates
    nj_wh_rate: 0,
    ca_wh_rate: 0.07,
    terms_rate: 0.053,
    // Compliance
    suffocation_warning: 1,
    pre_ticket: 1,
    pre_pack: 1,
    pre_pack_label: 0,
    pre_pack_details: '1 Warehouse Pack / 36 Vendor Pack',
    cards_hangers: 1,
    cards_hangers_brand: '',
    sewn_in_label: 0,
    testing_required: 0,
    testing_procedure: '',
    // Shipping
    ship_direct_nj: 0,
    ship_direct_la: 1,
    ship_fob_dtc: 0,
    in_stock_order: 0,
    closeout_order: 0,
    top_samples: 1,
    pre_production_samples: 0,
    other_notes: ''
  });

  const [styleGroups, setStyleGroups] = useState([]);

  // Load initial data
  useEffect(() => {
    async function load() {
      try {
        const [custs, stylesData, ordersData] = await Promise.all([
          getCustomers(),
          getStyles({ active: true }),
          getOrders()
        ]);
        setCustomers(custs);
        setStyles(stylesData);
        setExistingOrders(ordersData);

        if (isEdit) {
          const order = await getOrder(id);
          setForm({
            so_number: order.so_number || '',
            log_number: order.log_number || '',
            po_number: order.po_number || '',
            customer_id: order.customer_id,
            salesperson: order.salesperson || '',
            entered_by: order.entered_by || '',
            order_date: order.order_date || '',
            ship_date: order.ship_date || '',
            cancel_date: order.cancel_date || '',
            mabd: order.mabd || '',
            status: order.status || 'draft',
            nj_wh_rate: order.nj_wh_rate || 0,
            ca_wh_rate: order.ca_wh_rate || 0.07,
            terms_rate: order.terms_rate || 0.053,
            suffocation_warning: order.suffocation_warning ?? 1,
            pre_ticket: order.pre_ticket ?? 1,
            pre_pack: order.pre_pack ?? 1,
            pre_pack_label: order.pre_pack_label ?? 0,
            pre_pack_details: order.pre_pack_details || '1 Warehouse Pack / 36 Vendor Pack',
            cards_hangers: order.cards_hangers ?? 1,
            cards_hangers_brand: order.cards_hangers_brand || '',
            sewn_in_label: order.sewn_in_label ?? 0,
            testing_required: order.testing_required ?? 0,
            testing_procedure: order.testing_procedure || '',
            ship_direct_nj: order.ship_direct_nj ?? 0,
            ship_direct_la: order.ship_direct_la ?? 1,
            ship_fob_dtc: order.ship_fob_dtc ?? 0,
            in_stock_order: order.in_stock_order ?? 0,
            closeout_order: order.closeout_order ?? 0,
            top_samples: order.top_samples ?? 1,
            pre_production_samples: order.pre_production_samples ?? 0,
            other_notes: order.other_notes || ''
          });

          // Reconstruct style groups from lines
          const groups = {};
          for (const line of (order.lines || [])) {
            const key = `${line.style_number}||${line.color}||${line.vpo_number}`;
            if (!groups[key]) {
              groups[key] = {
                id: Date.now() + Math.random(),
                style_number: line.style_number || '',
                description: line.description || '',
                available_sizes: line.available_sizes || [],
                available_colors: line.available_colors || [],
                color: line.color || '',
                sizes: {},
                sell_price: line.sell_price || 0,
                retail_price: line.retail_price || 0,
                first_cost: line.first_cost || 0,
                ppk_ctg: line.ppk_ctg || 0,
                vpo_number: line.vpo_number || '',
                vendor: line.vendor || '',
                shipping_mode: line.shipping_mode || 'BOAT',
                remarks: line.remarks || '',
                duty_pct: line.duty_pct ?? 0.146,
                tariff1_pct: line.tariff1_pct ?? 0.075,
                tariff2_pct: line.tariff2_pct ?? 0.200,
                royalty_pct: line.royalty_pct || 0,
                freight: line.freight ?? 0.15,
                misc: line.misc ?? 0.07,
                terms_rate: order.terms_rate || 0.053
              };
            }
            groups[key].sizes[line.size] = line.qty;
          }
          setStyleGroups(Object.values(groups));
        }
      } catch (err) {
        setError('Failed to load data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  // Flatten style groups to order lines
  function buildLines() {
    const lines = [];
    let lineNum = 1;
    for (const g of styleGroups) {
      for (const [size, qty] of Object.entries(g.sizes)) {
        const q = parseInt(qty) || 0;
        if (q > 0) {
          lines.push({
            line_number: lineNum++,
            style_number: g.style_number,
            color: g.color,
            size,
            qty: q,
            ppk_ctg: g.ppk_ctg || 0,
            sell_price: parseFloat(g.sell_price) || 0,
            retail_price: parseFloat(g.retail_price) || 0,
            vpo_number: g.vpo_number || '',
            first_cost: parseFloat(g.first_cost) || 0,
            vendor: g.vendor || '',
            agent_fee: 0,
            freight: parseFloat(g.freight) ?? 0.15,
            misc: parseFloat(g.misc) ?? 0.07,
            duty_pct: parseFloat(g.duty_pct) ?? 0.146,
            tariff1_pct: parseFloat(g.tariff1_pct) ?? 0.075,
            tariff2_pct: parseFloat(g.tariff2_pct) ?? 0.200,
            royalty_pct: parseFloat(g.royalty_pct) || 0,
            shipping_mode: g.shipping_mode || 'BOAT',
            remarks: g.remarks || ''
          });
        }
      }
    }
    return lines;
  }

  async function handleSave(status) {
    setSaving(true);
    setError('');
    try {
      const lines = buildLines();
      const payload = { ...form, status: status || form.status, lines };

      let result;
      if (savedOrderId) {
        result = await updateOrder(savedOrderId, payload);
      } else {
        result = await createOrder(payload);
        setSavedOrderId(result.id);
      }

      setSuccessMsg('Order saved successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Save failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!savedOrderId) {
      await handleSave('confirmed');
      return;
    }
    setExporting(true);
    setError('');
    try {
      // Save latest state first
      await updateOrder(savedOrderId, { ...form, lines: buildLines() });

      const response = await exportOrder(savedOrderId);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SO_${form.so_number || savedOrderId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setForm(prev => ({ ...prev, status: 'exported' }));
      setSuccessMsg('Excel file downloaded');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  }

  async function handleStatusChange(status) {
    if (!savedOrderId) return;
    try {
      await updateOrderStatus(savedOrderId, status);
      setForm(prev => ({ ...prev, status }));
      setSuccessMsg(`Order marked as ${status}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Status update failed: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const steps = ['Header Info', 'Line Items', 'Compliance', 'Review & Export'];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? `Edit Order ${form.so_number || '#' + id}` : 'New Sales Order'}
          </h1>
          {savedOrderId && (
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge-${form.status}`}>{form.status.charAt(0).toUpperCase() + form.status.slice(1)}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="btn-secondary text-sm"
        >
          ← Back to Orders
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {/* Step indicator */}
      <StepIndicator currentStep={step} steps={steps} onStepClick={setStep} />

      {/* Step content */}
      <div className="card p-6">
        {step === 1 && (
          <Step1
            form={form}
            setForm={setForm}
            customers={customers}
            existingOrders={existingOrders}
          />
        )}
        {step === 2 && (
          <Step2
            styleGroups={styleGroups}
            setStyleGroups={setStyleGroups}
            styles={styles}
            form={form}
          />
        )}
        {step === 3 && (
          <Step3 form={form} setForm={setForm} />
        )}
        {step === 4 && (
          <Step4
            form={form}
            styleGroups={styleGroups}
            customers={customers}
            savedOrderId={savedOrderId}
            onSave={handleSave}
            onExport={handleExport}
            onStatusChange={handleStatusChange}
            saving={saving}
            exporting={exporting}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="btn-secondary disabled:invisible"
          >
            ← Back
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="btn-secondary text-sm"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(s => Math.min(4, s + 1))}
                className="btn-primary"
              >
                Next →
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 italic">
                  Formatted for Blue Cherry upload compatibility
                </span>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="btn-green"
                >
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
