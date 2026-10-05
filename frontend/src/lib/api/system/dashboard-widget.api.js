import axios from '@/lib/utils/http-client';

export const dashboardWidgetApi = {
  getAll: () => axios.get('/dashboard-widgets'),
  getById: (id) => axios.get(`/dashboard-widgets/${id}`),
  create: (data) => axios.post('/dashboard-widgets', data),
  update: (id, data) => axios.put(`/dashboard-widgets/${id}`, data),
  delete: (id) => axios.delete(`/dashboard-widgets/${id}`),
  execute: (id) => axios.post(`/dashboard-widgets/${id}/execute`),
  executeAll: () => axios.get('/dashboard-widgets/execute'),
};
