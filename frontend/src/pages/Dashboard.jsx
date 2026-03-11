import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

  const steps = [
    {
      number: '01',
      title: 'Design team uploads style catalog',
      description: 'Upload an Excel file with style numbers, descriptions, colors, sizes, and costs — one time. Every style is immediately available to all sales reps.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      action: { label: 'Go to Style Catalog', to: '/styles' },
      color: 'indigo',
    },
    {
      number: '02',
      title: 'Sales rep creates order in minutes',
      description: 'Pick a customer, search for a style, and enter quantities per size — description, pricing, costs, and vendor details fill in automatically. No copy-paste.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      action: { label: 'Create New Order', to: '/orders/new' },
      color: 'violet',
    },
    {
      number: '03',
      title: 'Export ERP-ready SO instantly',
      description: 'One click generates a pixel-perfect .xlsx that matches the existing template exactly — same columns, same formulas, same formatting. Ready for Blue Cherry upload.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: { label: 'View Orders', to: '/orders' },
      color: 'emerald',
    },
  ];

  const colorMap = {
    indigo:  { bg: 'bg-indigo-50',  icon: 'bg-indigo-600 text-white',  num: 'text-indigo-300',  link: 'text-indigo-600 hover:text-indigo-800' },
    violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-600 text-white',  num: 'text-violet-300',  link: 'text-violet-600 hover:text-violet-800' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600 text-white', num: 'text-emerald-300', link: 'text-emerald-600 hover:text-emerald-800' },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Hero */}
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide uppercase mb-4">
          Proof of Concept
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          AI-Powered Sales Order Generator
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Replace the manual Excel process with a tool that auto-populates every order
          from the design catalog — and exports a file your ERP accepts without modification.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-6 text-center">
          <div className="text-4xl font-bold text-indigo-600 mb-1">
            {stats ? stats.totalStyles : '—'}
          </div>
          <div className="text-sm font-medium text-gray-600">Styles in Catalog</div>
          <div className="text-xs text-gray-400 mt-1">ready to use on any order</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-4xl font-bold text-gray-800 mb-1">
            {stats ? stats.orders.total : '—'}
          </div>
          <div className="text-sm font-medium text-gray-600">Total Orders</div>
          <div className="text-xs text-gray-400 mt-1 space-x-2">
            {stats && (
              <>
                <span className="text-gray-400">{stats.orders.draft} draft</span>
                <span>·</span>
                <span className="text-blue-500">{stats.orders.confirmed} confirmed</span>
                <span>·</span>
                <span className="text-emerald-500">{stats.orders.exported} exported</span>
              </>
            )}
          </div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-4xl font-bold text-emerald-600 mb-1">&lt; 5 min</div>
          <div className="text-sm font-medium text-gray-600">Order Entry Time</div>
          <div className="text-xs text-gray-400 mt-1">vs. 30+ min manually</div>
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">How it works</h2>
        <div className="grid grid-cols-3 gap-5">
          {steps.map((step) => {
            const c = colorMap[step.color];
            return (
              <div key={step.number} className={`rounded-xl p-6 ${c.bg} flex flex-col`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.icon}`}>
                    {step.icon}
                  </div>
                  <span className={`text-3xl font-black ${c.num}`}>{step.number}</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  {step.description}
                </p>
                <Link
                  to={step.action.to}
                  className={`mt-4 text-sm font-semibold inline-flex items-center gap-1 ${c.link} transition-colors`}
                >
                  {step.action.label}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-900">Ready to see it in action?</div>
          <div className="text-sm text-gray-500 mt-0.5">
            10 sample styles are already loaded. Create an order now to see the full workflow.
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link to="/styles" className="btn-secondary text-sm">View Styles</Link>
          <Link to="/orders/new" className="btn-primary text-sm">Create Sample Order</Link>
        </div>
      </div>

    </div>
  );
}
