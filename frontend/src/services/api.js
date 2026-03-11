import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3002/api'
});

// Styles
export const getStyles = (params) => api.get('/styles', { params }).then(r => r.data);
export const getStyle = (id) => api.get(`/styles/${id}`).then(r => r.data);
export const createStyle = (data) => api.post('/styles', data).then(r => r.data);
export const updateStyle = (id, data) => api.put(`/styles/${id}`, data).then(r => r.data);
export const deleteStyle = (id) => api.delete(`/styles/${id}`).then(r => r.data);
export const importStylesCSV = (formData) => api.post('/styles/import-csv', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);
export const importStylesXLSX = (formData) => api.post('/styles/import-xlsx', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);

// Stats
export const getStats = () => api.get('/stats').then(r => r.data);

// Customers
export const getCustomers = () => api.get('/customers').then(r => r.data);
export const getCustomer = (id) => api.get(`/customers/${id}`).then(r => r.data);
export const createCustomer = (data) => api.post('/customers', data).then(r => r.data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data).then(r => r.data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`).then(r => r.data);

// Orders
export const getOrders = (params) => api.get('/orders', { params }).then(r => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then(r => r.data);
export const createOrder = (data) => api.post('/orders', data).then(r => r.data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data).then(r => r.data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`).then(r => r.data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data);

// Export
export const exportOrder = async (id) => {
  const response = await api.get(`/export/${id}`, { responseType: 'blob' });
  return response;
};

// HTS
export const searchHTS = (q) => api.get('/hts/search', { params: { q } }).then(r => r.data);
export const suggestHTS = (params) => api.get('/hts/suggest', { params }).then(r => r.data);
export const getHTSCode = (code) => api.get(`/hts/${encodeURIComponent(code)}`).then(r => r.data);
export const getOrderChanges = (id) => api.get(`/orders/${id}/changes`).then(r => r.data);

export default api;
