import axios from '../../utils/http-client';

export const authApi = {
  // 登录
  login: (data) => axios.post('/auth/login', data, { errorMode: 'inline', authenticated: false }),

  // 注册
  register: (data) => axios.post('/auth/register', data, { errorMode: 'inline', authenticated: false }),

  // 登出
  logout: () => axios.post('/auth/logout'),

  // 刷新token
  refreshToken: () => axios.post('/auth/refresh'),

  // 获取当前用户信息
  getCurrentUser: (config) => axios.get('/auth/me', config),
};
