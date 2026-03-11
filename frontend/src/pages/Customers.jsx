import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/api';

const EMPTY_CUSTOMER = {
  customer_code: '',
  customer_name: '',
  default_ship_destination: 'DIRECT TO L.A',
  nj_wh_rate: 0,
  ca_wh_rate: 0.07,
  terms_rate: 0.053,
  notes: '',
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
  top_samples: 1
};

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        value ? 'translate-x-4' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

function CustomerModal({ customer, onSave, onClose }) {
  const [form, setForm] = useState(customer ? { ...customer } : { ...EMPTY_CUSTOMER });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('basic');

  function update(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer_code || !form.customer_name) {
      setError('Customer code and name are required');
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {customer ? `Edit ${customer.customer_name}` : 'New Customer'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {['basic', 'compliance'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'basic' ? 'Basic Info' : 'Compliance Defaults'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          {tab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Customer Code *</label>
                  <input
                    className="input"
                    value={form.customer_code}
                    onChange={e => update('customer_code', e.target.value)}
                    placeholder="e.g. Walmart.com"
                  />
                </div>
                <div>
                  <label className="label">Customer Name *</label>
                  <input
                    className="input"
                    value={form.customer_name}
                    onChange={e => update('customer_name', e.target.value.toUpperCase())}
                    placeholder="e.g. WALMART"
                  />
                </div>
              </div>

              <div>
                <label className="label">Default Ship Destination</label>
                <select
                  className="input"
                  value={form.default_ship_destination}
                  onChange={e => update('default_ship_destination', e.target.value)}
                >
                  <option>DIRECT TO L.A</option>
                  <option>DIRECT TO N.J</option>
                  <option>FOB / DTC</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">NJ WH Rate</label>
                  <input
                    type="number"
                    step="0.001"
                    className="input"
                    value={form.nj_wh_rate}
                    onChange={e => update('nj_wh_rate', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">{(form.nj_wh_rate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="label">CA WH Rate</label>
                  <input
                    type="number"
                    step="0.001"
                    className="input"
                    value={form.ca_wh_rate}
                    onChange={e => update('ca_wh_rate', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">{(form.ca_wh_rate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="label">Terms Rate</label>
                  <input
                    type="number"
                    step="0.001"
                    className="input"
                    value={form.terms_rate}
                    onChange={e => update('terms_rate', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">{(form.terms_rate * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                />
              </div>
            </>
          )}

          {tab === 'compliance' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">These values will be pre-filled when creating orders for this customer.</p>

              {[
                { key: 'suffocation_warning', label: 'Suffocation Warning' },
                { key: 'pre_ticket', label: 'Pre-Ticket' },
                { key: 'pre_pack', label: 'Pre-Pack', noteKey: 'pre_pack_details', notePlaceholder: '1 Warehouse Pack / 36 Vendor Pack' },
                { key: 'pre_pack_label', label: 'Pre-Pack Label' },
                { key: 'cards_hangers', label: 'Cards/Hangers', noteKey: 'cards_hangers_brand', notePlaceholder: 'Brand name' },
                { key: 'sewn_in_label', label: 'Sewn In Label' },
                { key: 'testing_required', label: 'Testing Required', noteKey: 'testing_procedure', notePlaceholder: 'Procedure details' },
                { key: 'top_samples', label: 'Top Samples' }
              ].map(item => (
                <div key={item.key}>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <Toggle value={!!form[item.key]} onChange={v => update(item.key, v ? 1 : 0)} />
                  </div>
                  {item.noteKey && !!form[item.key] && (
                    <input
                      type="text"
                      className="input text-xs mt-1"
                      value={form[item.noteKey] || ''}
                      placeholder={item.notePlaceholder}
                      onChange={e => update(item.noteKey, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form) {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, form);
    } else {
      await createCustomer(form);
    }
    load();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete customer ${name}?`)) return;
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} customers</p>
        </div>
        <button
          onClick={() => { setEditingCustomer(null); setShowModal(true); }}
          className="btn-primary"
        >
          + New Customer
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2">×</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">👥</div>
            <div className="text-lg font-medium mb-1">No customers yet</div>
            <button
              onClick={() => { setEditingCustomer(null); setShowModal(true); }}
              className="btn-primary mt-2"
            >
              + Add Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Default Ship</th>
                  <th className="px-4 py-3 text-right">NJ WH%</th>
                  <th className="px-4 py-3 text-right">CA WH%</th>
                  <th className="px-4 py-3 text-right">Terms%</th>
                  <th className="px-4 py-3 text-left">Cards/Hangers Brand</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-indigo-700 font-medium">{c.customer_code}</td>
                    <td className="table-cell font-medium">{c.customer_name}</td>
                    <td className="table-cell text-xs text-gray-500">{c.default_ship_destination}</td>
                    <td className="table-cell text-right text-sm">{(c.nj_wh_rate * 100).toFixed(1)}%</td>
                    <td className="table-cell text-right text-sm">{(c.ca_wh_rate * 100).toFixed(1)}%</td>
                    <td className="table-cell text-right text-sm">{(c.terms_rate * 100).toFixed(1)}%</td>
                    <td className="table-cell text-xs text-gray-500">{c.cards_hangers_brand || '—'}</td>
                    <td className="table-cell text-xs text-gray-500 max-w-xs truncate">{c.notes || '—'}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingCustomer(c); setShowModal(true); }}
                          className="px-2.5 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.customer_name)}
                          className="px-2.5 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
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

      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingCustomer(null); }}
        />
      )}
    </div>
  );
}
