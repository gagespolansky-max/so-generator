import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, deleteOrder, exportOrder, updateOrderStatus } from '../services/api';

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

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [exporting, setExporting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await getOrders(params);
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, statusFilter]);

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
      // Refresh to show exported status
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

  const summary = {
    total: orders.length,
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
            {summary.total} orders · {summary.draft} draft · {summary.confirmed} confirmed · {summary.exported} exported
          </p>
        </div>
        <button onClick={() => navigate('/orders/new')} className="btn-primary">
          + New Order
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          className="input max-w-xs"
          placeholder="Search SO#, customer, salesperson..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input w-40"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="exported">Exported</option>
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
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-lg font-medium mb-1">No orders found</div>
            <div className="text-sm mb-4">
              {search || statusFilter ? 'Try adjusting your filters' : 'Create your first sales order'}
            </div>
            {!search && !statusFilter && (
              <button onClick={() => navigate('/orders/new')} className="btn-primary">
                + New Order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">SO #</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">PO #</th>
                  <th className="px-4 py-3 text-left">Order Date</th>
                  <th className="px-4 py-3 text-left">Ship Date</th>
                  <th className="px-4 py-3 text-left">Salesperson</th>
                  <th className="px-4 py-3 text-right">Lines</th>
                  <th className="px-4 py-3 text-right">Total Qty</th>
                  <th className="px-4 py-3 text-right">Total Sell</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <span className="font-mono font-semibold text-indigo-700">
                        {order.so_number || `#${order.id}`}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium">{order.customer_name || '—'}</div>
                      {order.customer_code && (
                        <div className="text-xs text-gray-400">{order.customer_code}</div>
                      )}
                    </td>
                    <td className="table-cell text-gray-500">{order.po_number || '—'}</td>
                    <td className="table-cell text-gray-500">{order.order_date || '—'}</td>
                    <td className="table-cell text-gray-500">{order.ship_date || '—'}</td>
                    <td className="table-cell text-gray-500">{order.salesperson || '—'}</td>
                    <td className="table-cell text-right">{order.line_count}</td>
                    <td className="table-cell text-right font-medium">{Number(order.total_qty).toLocaleString()}</td>
                    <td className="table-cell text-right font-medium">
                      ${Number(order.total_sell).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="table-cell text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/orders/${order.id}/edit`)}
                          className="px-2.5 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleExport(order.id, order.so_number)}
                          disabled={exporting === order.id}
                          className="px-2.5 py-1 text-xs rounded border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                          {exporting === order.id ? '...' : 'Export'}
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          disabled={deleting === order.id}
                          className="px-2.5 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {deleting === order.id ? '...' : 'Del'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
