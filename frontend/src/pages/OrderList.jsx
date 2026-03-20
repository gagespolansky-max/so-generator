import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getOrders, deleteOrder, exportOrder, getBlanketOrders, deleteBlanketOrder } from '../services/api';

function StatusBadge({ status }) {
  const cls = {
    draft: 'badge-draft',
    confirmed: 'badge-confirmed',
    exported: 'badge-exported'
  }[status] || 'badge-draft';
  return (
    <span className={cls}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function BlanketStatusBadge({ status }) {
  const colors = {
    open:      'bg-blue-100 text-blue-700',
    partial:   'bg-amber-100 text-amber-700',
    fulfilled: 'bg-green-100 text-green-700',
    closed:    'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type, parentBlanketId }) {
  if (type === 'master') {
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">Master</span>;
  }
  if (parentBlanketId) {
    return (
      <Link
        to={`/blanket-orders/${parentBlanketId}`}
        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors"
      >
        Release
      </Link>
    );
  }
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Order</span>;
}

function NewOrderDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="btn-primary flex items-center gap-1">
        + New
        <svg className="w-3.5 h-3.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
          <Link
            to="/orders/new"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
          >
            + New Order
          </Link>
          <Link
            to="/blanket-orders/new"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 border-t border-gray-100"
          >
            + New Master Order
          </Link>
        </div>
      )}
    </div>
  );
}

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [blanketOrders, setBlanketOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [exporting, setExporting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const orderParams = {};
      if (search) orderParams.search = search;
      // Apply status filter only to regular orders if it's an order status
      const orderStatuses = ['draft', 'confirmed', 'exported'];
      const blanketStatuses = ['open', 'partial', 'fulfilled', 'closed'];
      if (statusFilter && orderStatuses.includes(statusFilter)) orderParams.status = statusFilter;

      const blanketParams = {};
      if (search) blanketParams.search = search;
      if (statusFilter && blanketStatuses.includes(statusFilter)) blanketParams.status = statusFilter;

      const [ordersData, blanketData] = await Promise.all([
        (typeFilter !== 'master') ? getOrders(orderParams) : Promise.resolve([]),
        (typeFilter !== 'oneoff') ? getBlanketOrders(blanketParams) : Promise.resolve([]),
      ]);
      setOrders(ordersData);
      setBlanketOrders(blanketData);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, statusFilter, typeFilter]);

  async function handleExport(orderId, soNumber) {
    setExporting(orderId);
    try {
      const response = await exportOrder(orderId);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SO_${soNumber || orderId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      load();
    } catch (err) {
      setError('Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this order? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setError('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleDeleteBlanket(id) {
    if (!window.confirm('Delete this master order? Child releases will be unlinked.')) return;
    setDeleting(`bo-${id}`);
    try {
      await deleteBlanketOrder(id);
      setBlanketOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setError('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  // Build combined list sorted by created_at desc
  const combined = [];
  for (const o of orders) {
    combined.push({ ...o, _type: 'order' });
  }
  for (const bo of blanketOrders) {
    combined.push({ ...bo, _type: 'master' });
  }
  combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const summary = {
    orders: orders.length,
    masters: blanketOrders.length,
    draft: orders.filter(o => o.status === 'draft').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    exported: orders.filter(o => o.status === 'exported').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {summary.orders} orders &middot; {summary.masters} masters &middot; {summary.draft} draft &middot; {summary.confirmed} confirmed &middot; {summary.exported} exported
          </p>
        </div>
        <NewOrderDropdown />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          className="input max-w-xs"
          placeholder="Search SO#, PO#, customer, salesperson..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input w-40"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Orders</option>
          <option value="oneoff">One-off Orders</option>
          <option value="master">Master Orders</option>
        </select>
        <select
          className="input w-40"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <optgroup label="Order Statuses">
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="exported">Exported</option>
          </optgroup>
          <optgroup label="Master Statuses">
            <option value="open">Open</option>
            <option value="partial">Partial</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="closed">Closed</option>
          </optgroup>
        </select>
        <button onClick={load} className="btn-secondary">
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : combined.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-lg font-medium mb-1">No orders found</div>
            <div className="text-sm mb-4">
              {search || statusFilter || typeFilter ? 'Try adjusting your filters' : 'Create your first sales order'}
            </div>
            {!search && !statusFilter && !typeFilter && (
              <Link to="/orders/new" className="btn-primary">
                + New Order
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">SO #</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">PO #</th>
                  <th className="px-4 py-3 text-left">Ship Date</th>
                  <th className="px-4 py-3 text-left">Salesperson</th>
                  <th className="px-4 py-3 text-right">Lines / Fulfillment</th>
                  <th className="px-4 py-3 text-right">Total Qty</th>
                  <th className="px-4 py-3 text-right">Total Sell</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {combined.map(row => {
                  if (row._type === 'master') {
                    const pct = row.total_committed_qty > 0 ? Math.round((row.released_qty / row.total_committed_qty) * 100) : 0;
                    const pctClamped = Math.min(pct, 100);
                    const barColor = pctClamped >= 100 ? 'bg-green-500' : pctClamped >= 50 ? 'bg-blue-500' : 'bg-amber-400';
                    return (
                      <tr key={`bo-${row.id}`} className="hover:bg-gray-50">
                        <td className="table-cell">
                          <span className="font-mono font-semibold text-indigo-700">
                            {row.po_number || <span className="text-gray-400 italic font-normal">—</span>}
                          </span>
                        </td>
                        <td className="table-cell text-center">
                          <TypeBadge type="master" />
                        </td>
                        <td className="table-cell">
                          <div className="font-medium">{row.customer_name || '—'}</div>
                          {row.customer_code && <div className="text-xs text-gray-400">{row.customer_code}</div>}
                        </td>
                        <td className="table-cell text-gray-500">{row.po_number || '—'}</td>
                        <td className="table-cell text-gray-500 text-xs">
                          {row.cancel_date_start || row.cancel_date_end
                            ? `${row.cancel_date_start || '?'} – ${row.cancel_date_end || '?'}`
                            : '—'}
                        </td>
                        <td className="table-cell text-gray-500">{row.salesperson || '—'}</td>
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pctClamped}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">{pct}%</span>
                          </div>
                        </td>
                        <td className="table-cell text-right text-sm">
                          <span className="text-xs text-gray-500">
                            {Number(row.released_qty).toLocaleString()} / {Number(row.total_committed_qty).toLocaleString()}
                          </span>
                        </td>
                        <td className="table-cell text-right font-medium">
                          ${Number(row.released_sell || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="table-cell text-center">
                          <BlanketStatusBadge status={row.status} />
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/blanket-orders/${row.id}`)}
                              className="px-2.5 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteBlanket(row.id)}
                              disabled={deleting === `bo-${row.id}`}
                              className="px-2.5 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {deleting === `bo-${row.id}` ? '...' : 'Del'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Regular order row
                  return (
                    <tr key={`o-${row.id}`} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <span className="font-mono font-semibold text-indigo-700">
                          {row.so_number || `#${row.id}`}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <TypeBadge type="order" parentBlanketId={row.parent_blanket_id} />
                      </td>
                      <td className="table-cell">
                        <div className="font-medium">{row.customer_name || '—'}</div>
                        {row.customer_code && (
                          <div className="text-xs text-gray-400">{row.customer_code}</div>
                        )}
                      </td>
                      <td className="table-cell text-gray-500">{row.po_number || '—'}</td>
                      <td className="table-cell text-gray-500">{row.ship_date || '—'}</td>
                      <td className="table-cell text-gray-500">{row.salesperson || '—'}</td>
                      <td className="table-cell text-right">{row.line_count}</td>
                      <td className="table-cell text-right font-medium">{Number(row.total_qty).toLocaleString()}</td>
                      <td className="table-cell text-right font-medium">
                        ${Number(row.total_sell).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="table-cell text-center">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/orders/${row.id}/edit`)}
                            className="px-2.5 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleExport(row.id, row.so_number)}
                            disabled={exporting === row.id}
                            className="px-2.5 py-1 text-xs rounded border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                          >
                            {exporting === row.id ? '...' : 'Export'}
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            disabled={deleting === row.id}
                            className="px-2.5 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {deleting === row.id ? '...' : 'Del'}
                          </button>
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
    </div>
  );
}
