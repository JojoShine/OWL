import axios from '@/lib/utils/http-client';

export const dashboardWidgetApi = {
  getAll: () => axios.get('/dashboard-widgets'),
  getById: (id) => axios.get(`/dashboard-widgets/${id}`),
  create: (data) => axios.post('/dashboard-widgets', data),
  update: (id, data, config) => axios.put(`/dashboard-widgets/${id}`, data, config),
  delete: (id) => axios.delete(`/dashboard-widgets/${id}`),
  execute: (id, config) => axios.post(`/dashboard-widgets/${id}/execute`, undefined, config),
  executeAll: () => axios.get('/dashboard-widgets/execute'),
};
