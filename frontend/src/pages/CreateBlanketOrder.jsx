import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getCustomers, getStyles, getOrders,
  getBlanketOrder, createBlanketOrder, updateBlanketOrder, updateBlanketOrderStatus,
  exportOrder
} from '../services/api';
import StepIndicator from '../components/StepIndicator';

// ── Commitment Line Card ─────────────────────────────────────────────────────
function CommitmentCard({ line, index, styles, onUpdate, onRemove }) {
  const [styleSearch, setStyleSearch] = useState(line.style_number || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const filteredStyles = styles.filter(s =>
    s.active !== 0 && (
      s.style_number.toLowerCase().includes(styleSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(styleSearch.toLowerCase())
    )
  ).slice(0, 12);

  const selectedStyle = styles.find(s => s.style_number === line.style_number);

  function selectStyle(style) {
    setStyleSearch(style.style_number);
    setShowDropdown(false);
    onUpdate(index, {
      style_number: style.style_number,
      sell_price: style.wholesale_price || 0,
      first_cost: style.first_cost || 0,
      _available_colors: style.available_colors || [],
      color: '',
    });
  }

  const colors = line._available_colors || (selectedStyle?.available_colors) || [];

  return (
    <div className="card p-4 relative">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
        title="Remove"
      >
        &times;
      </button>

      <div className="grid grid-cols-12 gap-3">
        {/* Style search */}
        <div className="col-span-4 relative" ref={searchRef}>
          <label className="label">Style #</label>
          <input
            type="text"
            className="input"
            value={styleSearch}
            placeholder="Search style..."
            onChange={e => { setStyleSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          {showDropdown && filteredStyles.length > 0 && (
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
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color */}
        <div className="col-span-2">
          <label className="label">Color</label>
          <select
            className="input"
            value={line.color || ''}
            onChange={e => onUpdate(index, { color: e.target.value })}
          >
            <option value="">Select...</option>
            {colors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Committed Qty */}
        <div className="col-span-2">
          <label className="label">Committed Qty</label>
          <input
            type="number"
            className="input"
            value={line.total_qty || ''}
            onChange={e => onUpdate(index, { total_qty: parseInt(e.target.value) || 0 })}
          />
        </div>

        {/* Sell Price */}
        <div className="col-span-2">
          <label className="label">Sell Price</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={line.sell_price || ''}
            onChange={e => onUpdate(index, { sell_price: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* First Cost */}
        <div className="col-span-2">
          <label className="label">First Cost</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={line.first_cost || ''}
            onChange={e => onUpdate(index, { first_cost: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Header ───────────────────────────────────────────────────────────
function Step1({ form, setForm, customers, existingOrders }) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  const selectedCustomer = customers.find(c => c.id === form.customer_id);

  const filtered = customers.filter(c =>
    c.customer_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(customerSearch.toLowerCase())
  );

  function selectCustomer(c) {
    setCustomerSearch(`${c.customer_name} (${c.customer_code})`);
    setShowCustDropdown(false);
    setForm(prev => ({ ...prev, customer_id: c.id }));
  }

  const salespersonSuggestions = [...new Set(existingOrders.map(o => o.salesperson).filter(Boolean))];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Master Order Header</h2>
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

        {/* PO Number */}
        <div>
          <label className="label">PO Number</label>
          <input
            type="text"
            className="input"
            value={form.po_number}
            onChange={e => setForm(prev => ({ ...prev, po_number: e.target.value }))}
          />
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="label">Description</label>
          <input
            type="text"
            className="input"
            value={form.description}
            placeholder='e.g. "FW26 Belts Program"'
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        {/* Salesperson */}
        <div>
          <label className="label">Salesperson</label>
          <input
            type="text"
            list="bo-salesperson-list"
            className="input"
            value={form.salesperson}
            onChange={e => setForm(prev => ({ ...prev, salesperson: e.target.value }))}
          />
          <datalist id="bo-salesperson-list">
            {salespersonSuggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>

        {/* Total Committed Qty */}
        <div>
          <label className="label">Total Committed Qty</label>
          <input
            type="number"
            className="input"
            value={form.total_committed_qty || ''}
            onChange={e => setForm(prev => ({ ...prev, total_committed_qty: parseInt(e.target.value) || 0 }))}
          />
        </div>

        {/* Cancel Date Start */}
        <div>
          <label className="label">Cancel Date Start</label>
          <input
            type="date"
            className="input"
            value={form.cancel_date_start}
            onChange={e => setForm(prev => ({ ...prev, cancel_date_start: e.target.value }))}
          />
        </div>

        {/* Cancel Date End */}
        <div>
          <label className="label">Cancel Date End</label>
          <input
            type="date"
            className="input"
            value={form.cancel_date_end}
            onChange={e => setForm(prev => ({ ...prev, cancel_date_end: e.target.value }))}
          />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={3}
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </div>

      {/* Customer info card */}
      {selectedCustomer && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-2">Customer Info</h3>
          <div className="flex gap-6 text-sm">
            <span className="text-indigo-700">Ship To: <strong>{selectedCustomer.default_ship_destination}</strong></span>
            <span className="text-indigo-700">NJ WH: <strong>{(selectedCustomer.nj_wh_rate * 100).toFixed(1)}%</strong></span>
            <span className="text-indigo-700">CA WH: <strong>{(selectedCustomer.ca_wh_rate * 100).toFixed(1)}%</strong></span>
            <span className="text-indigo-700">Terms: <strong>{(selectedCustomer.terms_rate * 100).toFixed(1)}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Committed Styles ────────────────────────────────────────────────
function Step2({ commitments, setCommitments, styles, totalCommittedQty }) {
  function addLine() {
    setCommitments(prev => [...prev, {
      id: Date.now() + Math.random(),
      style_number: '', color: '', total_qty: 0, sell_price: 0, first_cost: 0,
      _available_colors: [],
    }]);
  }

  function updateLine(index, updates) {
    setCommitments(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c));
  }

  function removeLine(index) {
    setCommitments(prev => prev.filter((_, i) => i !== index));
  }

  const lineQtyTotal = commitments.reduce((sum, c) => sum + (parseInt(c.total_qty) || 0), 0);
  const qtyMismatch = totalCommittedQty > 0 && lineQtyTotal !== totalCommittedQty;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Committed Styles</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Add the styles included in this blanket commitment.
          </p>
        </div>
        <button type="button" onClick={addLine} className="btn-primary text-sm">
          + Add Style
        </button>
      </div>

      {commitments.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm mb-2">No committed styles yet.</p>
          <button type="button" onClick={addLine} className="text-indigo-600 text-sm hover:underline">
            Add the first style
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {commitments.map((line, i) => (
            <CommitmentCard
              key={line.id || i}
              line={line}
              index={i}
              styles={styles}
              onUpdate={updateLine}
              onRemove={removeLine}
            />
          ))}
        </div>
      )}

      {/* Running total */}
      {commitments.length > 0 && (
        <div className={`flex items-center gap-4 text-sm px-4 py-3 rounded-lg border ${
          qtyMismatch
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-indigo-50 border-indigo-100 text-indigo-700'
        }`}>
          <span>Line total: <strong>{lineQtyTotal.toLocaleString()}</strong> units</span>
          {totalCommittedQty > 0 && (
            <>
              <span>&middot;</span>
              <span>Header commitment: <strong>{totalCommittedQty.toLocaleString()}</strong> units</span>
              {qtyMismatch && (
                <>
                  <span>&middot;</span>
                  <span className="font-medium">
                    Mismatch: {lineQtyTotal > totalCommittedQty ? '+' : ''}{(lineQtyTotal - totalCommittedQty).toLocaleString()} units
                  </span>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Review & Save ───────────────────────────────────────────────────
function Step3({ form, commitments, customers, isEdit, savedId, releases, onStatusChange, onExport, exportingId }) {
  const selectedCustomer = customers.find(c => c.id === form.customer_id);
  const lineQtyTotal = commitments.reduce((sum, c) => sum + (parseInt(c.total_qty) || 0), 0);
  const totalSell = commitments.reduce((sum, c) => sum + (c.total_qty || 0) * (c.sell_price || 0), 0);

  const ORDER_STATUS_COLORS = {
    draft: 'bg-gray-100 text-gray-600',
    confirmed: 'bg-blue-100 text-blue-700',
    exported: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Review</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div className="text-gray-500">Customer</div>
        <div className="font-medium">{selectedCustomer ? `${selectedCustomer.customer_name} (${selectedCustomer.customer_code})` : '—'}</div>
        <div className="text-gray-500">PO Number</div>
        <div className="font-medium">{form.po_number || '—'}</div>
        <div className="text-gray-500">Description</div>
        <div className="font-medium">{form.description || '—'}</div>
        <div className="text-gray-500">Salesperson</div>
        <div className="font-medium">{form.salesperson || '—'}</div>
        <div className="text-gray-500">Total Committed Qty</div>
        <div className="font-medium">{(form.total_committed_qty || 0).toLocaleString()} units</div>
        {(form.cancel_date_start || form.cancel_date_end) && (
          <>
            <div className="text-gray-500">Cancel Window</div>
            <div className="font-medium">{form.cancel_date_start || '?'} &ndash; {form.cancel_date_end || '?'}</div>
          </>
        )}
        {form.notes && (
          <>
            <div className="text-gray-500">Notes</div>
            <div className="font-medium whitespace-pre-line">{form.notes}</div>
          </>
        )}
      </div>

      {/* Committed styles table */}
      {commitments.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 text-sm font-medium text-gray-700">
            Committed Styles ({commitments.length})
          </div>
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="table-cell text-left">Style #</th>
                <th className="table-cell text-left">Color</th>
                <th className="table-cell text-right">Qty</th>
                <th className="table-cell text-right">Sell $</th>
                <th className="table-cell text-right">First $</th>
                <th className="table-cell text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commitments.map((c, i) => (
                <tr key={i}>
                  <td className="table-cell font-mono text-sm">{c.style_number || '—'}</td>
                  <td className="table-cell text-sm">{c.color || '—'}</td>
                  <td className="table-cell text-right text-sm">{(c.total_qty || 0).toLocaleString()}</td>
                  <td className="table-cell text-right text-sm">${(c.sell_price || 0).toFixed(2)}</td>
                  <td className="table-cell text-right text-sm">${(c.first_cost || 0).toFixed(2)}</td>
                  <td className="table-cell text-right text-sm font-medium">
                    ${((c.total_qty || 0) * (c.sell_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td className="table-cell" colSpan={2}>Total</td>
                <td className="table-cell text-right">{lineQtyTotal.toLocaleString()}</td>
                <td className="table-cell" colSpan={2}></td>
                <td className="table-cell text-right">
                  ${totalSell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Edit-mode extras: status + releases */}
      {isEdit && savedId && (
        <>
          <div className="flex items-center gap-3">
            <label className="label mb-0">Status:</label>
            <select
              value={form.status}
              onChange={e => onStatusChange(e.target.value)}
              className="input w-40 text-sm"
            >
              <option value="open">Open</option>
              <option value="partial">Partial</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Releases table */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Releases</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  {releases.length}
                </span>
              </div>
              <Link
                to={`/orders/new?blanket_id=${savedId}&customer_id=${form.customer_id || ''}`}
                className="btn-primary text-sm"
              >
                + New Release
              </Link>
            </div>
            {releases.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No releases yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="table-cell text-left">SO #</th>
                    <th className="table-cell text-left">Ship Date</th>
                    <th className="table-cell text-right">Lines</th>
                    <th className="table-cell text-right">Qty</th>
                    <th className="table-cell text-right">Total Sell</th>
                    <th className="table-cell text-center">Status</th>
                    <th className="table-cell text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {releases.map(rel => (
                    <tr key={rel.id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono text-sm font-medium text-indigo-700">
                        {rel.so_number || `#${rel.id}`}
                      </td>
                      <td className="table-cell text-sm text-gray-600">{rel.ship_date || '—'}</td>
                      <td className="table-cell text-right text-sm">{rel.line_count}</td>
                      <td className="table-cell text-right text-sm font-medium">{rel.total_qty.toLocaleString()}</td>
                      <td className="table-cell text-right text-sm">
                        ${rel.total_sell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ORDER_STATUS_COLORS[rel.status] || 'bg-gray-100 text-gray-600'}`}>
                          {rel.status}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/orders/${rel.id}/edit`} className="btn-secondary text-xs py-1 px-2">Edit</Link>
                          <button
                            onClick={() => onExport(rel.id)}
                            disabled={exportingId === rel.id}
                            className="btn-secondary text-xs py-1 px-2"
                          >
                            {exportingId === rel.id ? '\u2026' : 'Export'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function CreateBlanketOrder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [existingOrders, setExistingOrders] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(isEdit ? parseInt(id) : null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [exportingId, setExportingId] = useState(null);

  const [form, setForm] = useState({
    po_number: '',
    customer_id: null,
    description: '',
    salesperson: '',
    total_committed_qty: 0,
    cancel_date_start: '',
    cancel_date_end: '',
    status: 'open',
    notes: '',
  });

  const [commitments, setCommitments] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [custs, stylesData, ordersData] = await Promise.all([
          getCustomers(),
          getStyles({ active: true }),
          getOrders(),
        ]);
        setCustomers(custs);
        setStyles(stylesData);
        setExistingOrders(ordersData);

        if (isEdit) {
          const bo = await getBlanketOrder(id);
          setForm({
            po_number: bo.po_number || '',
            customer_id: bo.customer_id,
            description: bo.description || '',
            salesperson: bo.salesperson || '',
            total_committed_qty: bo.total_committed_qty || 0,
            cancel_date_start: bo.cancel_date_start || '',
            cancel_date_end: bo.cancel_date_end || '',
            status: bo.status || 'open',
            notes: bo.notes || '',
          });
          setCommitments((bo.commitments || []).map(c => ({
            ...c,
            id: c.id || Date.now() + Math.random(),
            _available_colors: [],
          })));
          setReleases(bo.releases || []);
        }
      } catch (err) {
        setError('Failed to load data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        total_committed_qty: parseInt(form.total_committed_qty) || 0,
        commitments: commitments.map(c => ({
          style_number: c.style_number || '',
          color: c.color || '',
          total_qty: parseInt(c.total_qty) || 0,
          sell_price: parseFloat(c.sell_price) || 0,
          first_cost: parseFloat(c.first_cost) || 0,
        })),
      };

      let result;
      if (savedId) {
        result = await updateBlanketOrder(savedId, payload);
      } else {
        result = await createBlanketOrder(payload);
        setSavedId(result.id);
      }
      setSuccessMsg('Master order saved!');
      setTimeout(() => setSuccessMsg(''), 3000);
      if (!isEdit && result.id) {
        navigate(`/blanket-orders/${result.id}/edit`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status) {
    if (!savedId) return;
    try {
      await updateBlanketOrderStatus(savedId, status);
      setForm(prev => ({ ...prev, status }));
      setSuccessMsg(`Status updated to ${status}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExport(orderId) {
    setExportingId(orderId);
    try {
      const response = await exportOrder(orderId);
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `SO_${orderId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed: ' + err.message);
    } finally {
      setExportingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const steps = ['Header Info', 'Committed Styles', 'Review & Save'];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? `Edit Master Order ${form.po_number || '#' + id}` : 'New Master Order'}
          </h1>
          {savedId && (
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                { open: 'bg-blue-100 text-blue-700', partial: 'bg-amber-100 text-amber-700',
                  fulfilled: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600' }[form.status]
              }`}>
                {form.status}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="btn-secondary text-sm"
        >
          &larr; Back to Orders
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{successMsg}</div>
      )}

      <StepIndicator currentStep={step} steps={steps} onStepClick={setStep} />

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
            commitments={commitments}
            setCommitments={setCommitments}
            styles={styles}
            totalCommittedQty={form.total_committed_qty}
          />
        )}
        {step === 3 && (
          <Step3
            form={form}
            commitments={commitments}
            customers={customers}
            isEdit={isEdit}
            savedId={savedId}
            releases={releases}
            onStatusChange={handleStatusChange}
            onExport={handleExport}
            exportingId={exportingId}
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
            &larr; Back
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-secondary text-sm"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(s => Math.min(3, s + 1))}
                className="btn-primary"
              >
                Next &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : (isEdit ? 'Update Master Order' : 'Create Master Order')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
