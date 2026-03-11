import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OrderList from './pages/OrderList';
import CreateOrder from './pages/CreateOrder';
import StyleCatalog from './pages/StyleCatalog';
import Customers from './pages/Customers';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/new" element={<CreateOrder />} />
          <Route path="/orders/:id/edit" element={<CreateOrder />} />
          <Route path="/styles" element={<StyleCatalog />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
