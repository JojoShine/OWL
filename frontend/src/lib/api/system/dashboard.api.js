import axios from '../../utils/http-client';

export const dashboardApi = {
  // 获取看板列表
  getDashboards: (params) => axios.get('/dashboards', { params }),

  // 获取看板详情
  getDashboard: (id) => axios.get(`/dashboards/${id}`),

  // 创建看板
  createDashboard: (data) => axios.post('/dashboards', data),

  // 更新看板
  updateDashboard: (id, data) => axios.put(`/dashboards/${id}`, data),

  // 删除看板
  deleteDashboard: (id) => axios.delete(`/dashboards/${id}`),

  // 获取看板数据
  getDashboardData: (id, params) => axios.get(`/dashboards/${id}/data`, { params }),
};
