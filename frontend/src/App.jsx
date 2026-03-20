import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OrderList from './pages/OrderList';
import CreateOrder from './pages/CreateOrder';
import StyleCatalog from './pages/StyleCatalog';
import Customers from './pages/Customers';
import Admin from './pages/Admin';
import BlanketOrders from './pages/BlanketOrders';
import BlanketOrderDetail from './pages/BlanketOrderDetail';
import CreateBlanketOrder from './pages/CreateBlanketOrder';

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
          <Route path="/blanket-orders" element={<BlanketOrders />} />
          <Route path="/blanket-orders/new" element={<CreateBlanketOrder />} />
          <Route path="/blanket-orders/:id" element={<BlanketOrderDetail />} />
          <Route path="/blanket-orders/:id/edit" element={<CreateBlanketOrder />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
