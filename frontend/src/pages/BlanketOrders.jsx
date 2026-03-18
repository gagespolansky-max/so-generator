import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlanketOrders, deleteBlanketOrder, getCustomers } from '../services/api';

const STATUS_COLORS = {
  open:      'bg-blue-100 text-blue-700',
  partial:   'bg-amber-100 text-amber-700',
  fulfilled: 'bg-green-100 text-green-700',
  closed:    'bg-gray-100 text-gray-600',
};

function ProgressBar({ released, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((released / total) * 100)) : 0;
  const color = pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-16">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function BlanketOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    po_number: '', customer_id: '', description: '', salesperson: '',
    total_committed_qty: '', cancel_date_start: '', cancel_date_end: '',
    status: 'open', notes: '', commitments: []
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [data, custs] = await Promise.all([
        getBlanketOrders({ search: search || undefined, status: statusFilter || undefined }),
        getCustomers()
      ]);
      setOrders(data);
      setCustomers(custs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, statusFilter]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this master order? Child releases will be unlinked.')) return;
    try {
      await deleteBlanketOrder(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { createBlanketOrder } = await import('../services/api');
      const result = await createBlanketOrder({
        ...form,
        customer_id: form.customer_id || null,
        total_committed_qty: parseInt(form.total_committed_qty) || 0,
        commitments: form.commitments,
      });
      setShowNew(false);
      setForm({
        po_number: '', customer_id: '', description: '', salesperson: '',
        total_committed_qty: '', cancel_date_start: '', cancel_date_end: '',
        status: 'open', notes: '', commitments: []
      });
      navigate(`/blanket-orders/${result.id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  function addCommitmentRow() {
    setForm(f => ({
      ...f,
      commitments: [...f.commitments, { style_number: '', color: '', total_qty: '', sell_price: '', first_cost: '' }]
    }));
  }

  function updateCommitment(idx, field, value) {
    setForm(f => {
      const c = [...f.commitments];
      c[idx] = { ...c[idx], [field]: value };
      return { ...f, commitments: c };
    });
  }

  function removeCommitment(idx) {
    setForm(f => ({ ...f, commitments: f.commitments.filter((_, i) => i !== idx) }));
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Blanket / standing orders with release tracking</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          + New Master Order
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search PO#, customer, description…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-40">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="partial">Partial</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-2">No master orders found</p>
            <p className="text-sm">Create your first blanket/standing order above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="table-cell text-left">PO #</th>
                <th className="table-cell text-left">Customer</th>
                <th className="table-cell text-left">Description</th>
                <th className="table-cell text-left">Salesperson</th>
                <th className="table-cell text-right">Releases</th>
                <th className="table-cell" style={{ width: 180 }}>Fulfillment</th>
                <th className="table-cell text-center">Status</th>
                <th className="table-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(bo => (
                <tr key={bo.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-sm font-medium text-indigo-700">
                    {bo.po_number || <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="table-cell">
                    <div className="font-medium text-sm">{bo.customer_name || '—'}</div>
                    {bo.customer_code && <div className="text-xs text-gray-400">{bo.customer_code}</div>}
                  </td>
                  <td className="table-cell text-sm text-gray-600">{bo.description || '—'}</td>
                  <td className="table-cell text-sm text-gray-600">{bo.salesperson || '—'}</td>
                  <td className="table-cell text-right text-sm font-medium">{bo.release_count}</td>
                  <td className="table-cell">
                    <ProgressBar released={bo.released_qty} total={bo.total_committed_qty} />
                    <div className="text-xs text-gray-400 mt-0.5 text-right">
                      {bo.released_qty.toLocaleString()} / {bo.total_committed_qty.toLocaleString()} units
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[bo.status] || 'bg-gray-100 text-gray-600'}`}>
                      {bo.status}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/blanket-orders/${bo.id}`)}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(bo.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-1"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Master Order Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">New Master Order</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">PO Number</label>
                  <input className="input w-full" value={form.po_number} onChange={e => setForm(f => ({ ...f, po_number: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Customer</label>
                  <select className="input w-full" value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                    <option value="">— Select —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <input className="input w-full" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Salesperson</label>
                  <input className="input w-full" value={form.salesperson} onChange={e => setForm(f => ({ ...f, salesperson: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Total Committed Qty</label>
                  <input type="number" className="input w-full" value={form.total_committed_qty} onChange={e => setForm(f => ({ ...f, total_committed_qty: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cancel Window Start</label>
                  <input type="date" className="input w-full" value={form.cancel_date_start} onChange={e => setForm(f => ({ ...f, cancel_date_start: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cancel Window End</label>
                  <input type="date" className="input w-full" value={form.cancel_date_end} onChange={e => setForm(f => ({ ...f, cancel_date_end: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Notes</label>
                  <textarea className="input w-full" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              {/* Commitments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Committed Styles</label>
                  <button type="button" onClick={addCommitmentRow} className="text-xs text-indigo-600 hover:underline">+ Add Style</button>
                </div>
                {form.commitments.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Style #</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Color</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Qty</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Sell $</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">First $</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {form.commitments.map((c, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1"><input className="input w-full text-xs py-1" value={c.style_number} onChange={e => updateCommitment(i, 'style_number', e.target.value)} /></td>
                            <td className="px-2 py-1"><input className="input w-full text-xs py-1" value={c.color} onChange={e => updateCommitment(i, 'color', e.target.value)} /></td>
                            <td className="px-2 py-1"><input type="number" className="input w-20 text-xs py-1 text-right" value={c.total_qty} onChange={e => updateCommitment(i, 'total_qty', e.target.value)} /></td>
                            <td className="px-2 py-1"><input type="number" step="0.01" className="input w-20 text-xs py-1 text-right" value={c.sell_price} onChange={e => updateCommitment(i, 'sell_price', e.target.value)} /></td>
                            <td className="px-2 py-1"><input type="number" step="0.01" className="input w-20 text-xs py-1 text-right" value={c.first_cost} onChange={e => updateCommitment(i, 'first_cost', e.target.value)} /></td>
                            <td className="px-2 py-1 text-center"><button type="button" onClick={() => removeCommitment(i)} className="text-red-400 hover:text-red-600">&times;</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Creating…' : 'Create Master Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
