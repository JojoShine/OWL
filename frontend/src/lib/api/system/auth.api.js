import axios from '../../utils/http-client';

export const authApi = {
  // 登录
  login: (data) => axios.post('/auth/login', data),

  // 注册
  register: (data) => axios.post('/auth/register', data),

  // 登出
  logout: () => axios.post('/auth/logout'),

  // 刷新token
  refreshToken: () => axios.post('/auth/refresh'),

  // 获取当前用户信息
  getCurrentUser: () => axios.get('/auth/me'),
};