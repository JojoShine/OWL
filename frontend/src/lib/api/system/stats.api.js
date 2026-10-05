import axios from '../../utils/http-client';

export const statsApi = {
  // 获取首页仪表板统计数据
  getDashboardStats: () => axios.get('/stats/dashboard'),

  // 获取用户统计数据
  getUserStats: () => axios.get('/stats/users'),

  // 获取角色统计数据
  getRoleStats: () => axios.get('/stats/roles'),
};