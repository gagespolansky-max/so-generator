import React, { useState, useEffect } from 'react';
import { getCustomers, updateCustomer, getHTSCode } from '../services/api';

const ADMIN_PASSWORD = 'amieelynn2024';

const HTS_CODES_NOTE = [
  { code: '4203.30.00', description: 'Leather belts', duty: '2.7%', t1: '25%', t2: '20%' },
  { code: '4205.00.80', description: 'Leather accessories', duty: '2.4%', t1: '25%', t2: '20%' },
  { code: '3926.20.90', description: 'Plastic clothing accessories', duty: '5.3%', t1: '25%', t2: '20%' },
  { code: '4015.90.80', description: 'Rubber belts/accessories', duty: '2.6%', t1: '25%', t2: '20%' },
  { code: '6217.10.9005', description: 'Man-made fiber accessories', duty: '14.6%', t1: '25%', t2: '20%' },
  { code: '6217.10.1000', description: 'Knitted headbands/belts', duty: '14.6%', t1: '25%', t2: '20%' },
  { code: '6217.10.8500', description: 'Other textile accessories', duty: '14.6%', t1: '25%', t2: '20%' },
  { code: '7117.19.9000', description: 'Imitation jewelry (other)', duty: '11%', t1: '25%', t2: '20%' },
  { code: '7117.19.1000', description: 'Imitation jewelry (base metal)', duty: '7.2%', t1: '25%', t2: '20%' },
  { code: '6116.92.9400', description: 'Gloves - man-made fiber', duty: '18.6%', t1: '25%', t2: '20%' },
];

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === '1');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [tab, setTab] = useState('rates');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);
  const [editRates, setEditRates] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => {
    if (authed) loadCustomers();
  }, [authed]);

  async function loadCustomers() {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
      const init = {};
      data.forEach(c => {
        init[c.id] = {
          nj_wh_rate: c.nj_wh_rate ?? 0,
          ca_wh_rate: c.ca_wh_rate ?? 0.07,
          terms_rate: c.terms_rate ?? 0.053,
        };
      });
      setEditRates(init);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', '1');
      setAuthed(true);
    } else {
      setPwError('Incorrect password');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_authed');
    setAuthed(false);
  }

  function handleRateChange(customerId, field, value) {
    setEditRates(prev => ({
      ...prev,
      [customerId]: { ...prev[customerId], [field]: value },
    }));
  }

  async function handleSaveRates(customer) {
    setSaving(customer.id);
    try {
      const rates = editRates[customer.id];
      await updateCustomer(customer.id, {
        ...customer,
        nj_wh_rate: parseFloat(rates.nj_wh_rate) || 0,
        ca_wh_rate: parseFloat(rates.ca_wh_rate) || 0,
        terms_rate: parseFloat(rates.terms_rate) || 0,
      });
      setSaved(prev => ({ ...prev, [customer.id]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [customer.id]: false })), 2000);
      await loadCustomers();
    } finally {
      setSaving(null);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Admin Access</div>
              <div className="text-xs text-gray-500">Enter admin password to continue</div>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={pwInput}
                onChange={e => { setPwInput(e.target.value); setPwError(''); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Admin password"
                autoFocus
              />
              {pwError && <p className="mt-1 text-xs text-red-600">{pwError}</p>}
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage backend cost rates and system configuration</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {[
            { id: 'rates', label: 'Customer Rates' },
            { id: 'hts', label: 'HTS Reference' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Rates Tab */}
      {tab === 'rates' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800">Customer Warehouse & Terms Rates</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              These rates are admin-controlled. NJ/CA rates are % of first cost for warehouse handling. Terms rate is % of sell per line (contract-driven).
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Code</th>
                  <th className="px-6 py-3 text-right">NJ WH Rate %</th>
                  <th className="px-6 py-3 text-right">CA WH Rate %</th>
                  <th className="px-6 py-3 text-right">Terms Rate %</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {customers.map(customer => {
                  const rates = editRates[customer.id] || {};
                  const isSaving = saving === customer.id;
                  const wasSaved = saved[customer.id];
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900 text-sm">{customer.customer_name}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs font-mono">{customer.customer_code}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={(parseFloat(rates.nj_wh_rate || 0) * 100).toFixed(2)}
                            onChange={e => handleRateChange(customer.id, 'nj_wh_rate', parseFloat(e.target.value) / 100)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-gray-400 text-xs">%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={(parseFloat(rates.ca_wh_rate || 0) * 100).toFixed(2)}
                            onChange={e => handleRateChange(customer.id, 'ca_wh_rate', parseFloat(e.target.value) / 100)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-gray-400 text-xs">%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={(parseFloat(rates.terms_rate || 0) * 100).toFixed(2)}
                            onChange={e => handleRateChange(customer.id, 'terms_rate', parseFloat(e.target.value) / 100)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-gray-400 text-xs">%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleSaveRates(customer)}
                          disabled={isSaving}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                            wasSaved
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isSaving ? 'Saving…' : wasSaved ? '✓ Saved' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
            <strong>Note:</strong> Rate changes apply to new orders only. Existing POs retain the rates that were active at time of creation.
          </div>
        </div>
      )}

      {/* HTS Reference Tab */}
      {tab === 'hts' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <div className="font-semibold mb-1">⚠️ HTS Rate Update Policy</div>
            <p>
              HTS code rates are updated periodically to reflect USITC and CBP rate schedule changes.
              <strong> Any rate updates apply on a go-forward basis only</strong> — existing confirmed/exported POs retain
              the duty and tariff rates that were in effect at the time the order was created. This ensures
              historical cost accuracy and complies with Blue Cherry ERP audit requirements.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-800">Current HTS Rate Table</h2>
              <p className="text-xs text-gray-500 mt-0.5">MFN (Column 1) duty rates + Section 301 (T1: 25%) and IEEPA (T2: 20%) China tariffs. T1/T2 apply to China-origin goods only.</p>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left">HTS Code</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-right">Duty (MFN)</th>
                  <th className="px-6 py-3 text-right">T1 (Sec. 301)</th>
                  <th className="px-6 py-3 text-right">T2 (IEEPA)</th>
                  <th className="px-6 py-3 text-right">China Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {HTS_CODES_NOTE.map(row => {
                  const dutyNum = parseFloat(row.duty);
                  const t1Num = parseFloat(row.t1);
                  const t2Num = parseFloat(row.t2);
                  const chinaTotal = (dutyNum + t1Num + t2Num).toFixed(1);
                  return (
                    <tr key={row.code} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-sm text-indigo-700">{row.code}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{row.description}</td>
                      <td className="px-6 py-3 text-right text-sm">{row.duty}</td>
                      <td className="px-6 py-3 text-right text-sm text-orange-600">{row.t1}</td>
                      <td className="px-6 py-3 text-right text-sm text-red-600">{row.t2}</td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-red-700">{chinaTotal}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              Rates sourced from USITC HTS schedule. T1 = Section 301 List 3 (China). T2 = IEEPA Executive Order (2025). Last verified: March 2025.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
