import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBlanketOrder, updateBlanketOrderStatus, exportOrder } from '../services/api';

const STATUS_COLORS = {
  open:      'bg-blue-100 text-blue-700',
  partial:   'bg-amber-100 text-amber-700',
  fulfilled: 'bg-green-100 text-green-700',
  closed:    'bg-gray-100 text-gray-600',
};

const ORDER_STATUS_COLORS = {
  draft:     'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  exported:  'bg-green-100 text-green-700',
};

function StatCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    gray:   'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs mt-1 opacity-70">{sub}</div>}
    </div>
  );
}

export default function BlanketOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bo, setBo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusChanging, setStatusChanging] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getBlanketOrder(id);
      setBo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleStatusChange(status) {
    setStatusChanging(true);
    try {
      await updateBlanketOrderStatus(id, status);
      setBo(prev => ({ ...prev, status }));
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusChanging(false);
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
      await load();
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

  if (error || !bo) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
        <button onClick={() => navigate('/blanket-orders')} className="btn-secondary">← Back</button>
      </div>
    );
  }

  const releasedQty = bo.releases.reduce((sum, r) => sum + r.total_qty, 0);
  const releasedSell = bo.releases.reduce((sum, r) => sum + r.total_sell, 0);
  const remainingQty = Math.max(0, bo.total_committed_qty - releasedQty);
  const pctFulfilled = bo.total_committed_qty > 0
    ? Math.min(100, Math.round((releasedQty / bo.total_committed_qty) * 100))
    : 0;
  const progressColor = pctFulfilled >= 100 ? 'bg-green-500' : pctFulfilled >= 50 ? 'bg-blue-500' : 'bg-amber-400';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/orders')} className="text-gray-400 hover:text-gray-600 text-sm">
              &larr; Orders
            </button>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Master PO: {bo.po_number || <span className="text-gray-400 italic font-normal">No PO#</span>}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[bo.status]}`}>
              {bo.status}
            </span>
          </div>
          {bo.description && <p className="text-sm text-gray-500 mt-1">{bo.description}</p>}
          {bo.customer_name && (
            <p className="text-sm text-gray-600 mt-0.5">
              <span className="font-medium">{bo.customer_name}</span>
              {bo.customer_code && <span className="text-gray-400 ml-1">({bo.customer_code})</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">Change Status:</label>
            <select
              value={bo.status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={statusChanging}
              className="input text-sm py-1"
            >
              <option value="open">Open</option>
              <option value="partial">Partial</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button
            onClick={() => navigate(`/blanket-orders/${id}/edit`)}
            className="btn-secondary text-sm"
          >
            Edit
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Committed"
          value={bo.total_committed_qty.toLocaleString()}
          sub="units"
          color="indigo"
        />
        <StatCard
          label="Released"
          value={releasedQty.toLocaleString()}
          sub={`$${releasedSell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sell`}
          color="green"
        />
        <StatCard
          label="Remaining"
          value={remainingQty.toLocaleString()}
          sub="units to release"
          color="amber"
        />
        <div className="rounded-xl border bg-gray-50 text-gray-700 border-gray-200 p-4">
          <div className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">% Fulfilled</div>
          <div className="text-2xl font-bold mb-2">{pctFulfilled}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${progressColor} transition-all`} style={{ width: `${pctFulfilled}%` }} />
          </div>
        </div>
      </div>

      {/* Cancel Window */}
      {(bo.cancel_date_start || bo.cancel_date_end) && (
        <div className="card p-4 mb-6 flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700">Cancel Window:</div>
          {bo.cancel_date_start && (
            <div className="text-sm text-gray-600">Start: <span className="font-medium">{bo.cancel_date_start}</span></div>
          )}
          {bo.cancel_date_end && (
            <div className="text-sm text-gray-600">End: <span className="font-medium">{bo.cancel_date_end}</span></div>
          )}
        </div>
      )}

      {/* Committed Styles */}
      <div className="card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Committed Styles</h2>
        </div>
        {bo.commitments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No committed styles.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="table-cell text-left">Style #</th>
                <th className="table-cell text-left">Color</th>
                <th className="table-cell text-right">Committed Qty</th>
                <th className="table-cell text-right">Sell Price</th>
                <th className="table-cell text-right">First Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bo.commitments.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-sm font-medium">{c.style_number || '—'}</td>
                  <td className="table-cell text-sm">{c.color || '—'}</td>
                  <td className="table-cell text-right text-sm font-medium">{c.total_qty.toLocaleString()}</td>
                  <td className="table-cell text-right text-sm">${c.sell_price.toFixed(2)}</td>
                  <td className="table-cell text-right text-sm">${c.first_cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Releases */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Releases</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {bo.releases.length}
            </span>
          </div>
          <Link
            to={`/orders/new?blanket_id=${id}&customer_id=${bo.customer_id || ''}`}
            className="btn-primary text-sm"
          >
            + New Release
          </Link>
        </div>

        {bo.releases.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No releases yet.</p>
            <Link to={`/orders/new?blanket_id=${id}&customer_id=${bo.customer_id || ''}`} className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
              Create the first release →
            </Link>
          </div>
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
              {bo.releases.map(rel => (
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
                      <Link
                        to={`/orders/${rel.id}/edit`}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleExport(rel.id)}
                        disabled={exportingId === rel.id}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        {exportingId === rel.id ? '…' : 'Export'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes */}
      {bo.notes && (
        <div className="card p-4 mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{bo.notes}</p>
        </div>
      )}
    </div>
  );
}
