import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  const navLinks = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/orders', label: 'Orders' },
    { to: '/blanket-orders', label: 'Master Orders' },
    { to: '/styles', label: 'Styles' },
    { to: '/customers', label: 'Customers' },
    { to: '/admin', label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">SO</span>
                </div>
                <span className="font-semibold text-gray-900 text-base">SO Generator</span>
              </div>
              <div className="flex items-center gap-1">
                {navLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <NavLink
              to="/orders/new"
              className="btn-primary text-sm"
            >
              + New Order
            </NavLink>
          </div>
        </div>
      </nav>
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
