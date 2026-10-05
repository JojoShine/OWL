import axios from '@/lib/utils/http-client';

export const systemConfigApi = {
  // 获取系统配置
  getConfig: () => axios.get('/system-config'),

  // 更新系统配置
  updateConfig: (data) => axios.put('/system-config', data),

  // 上传 Logo
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/system-config/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 上传登录背景
  uploadLoginBg: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/system-config/login-bg', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
