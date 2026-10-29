import { encryptLoginCredentials } from '../../utils/login-envelope';
import axios from '../../utils/http-client';

export const authApi = {
  // 登录
  login: async (data) => {
    const options = { errorMode: 'inline', authenticated: false };
    const response = await axios.post('/auth/challenge', {}, options);
    const envelope = await encryptLoginCredentials(data, response.data);
    return axios.post('/auth/login', { ...envelope, captchaId: data.captchaId, captchaCode: data.captchaCode }, options);
  },

  // 注册
  register: (data) => axios.post('/auth/register', data, { errorMode: 'inline', authenticated: false }),

  // 登出
  logout: () => axios.post('/auth/logout'),

  // 刷新token
  refreshToken: () => axios.post('/auth/refresh'),

  // 获取当前用户信息
  getCurrentUser: (config) => axios.get('/auth/me', config),
};
