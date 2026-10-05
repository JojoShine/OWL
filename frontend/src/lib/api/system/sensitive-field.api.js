import axios from '../../utils/http-client';

export const sensitiveFieldApi = {
  // 获取敏感字段列表
  getSensitiveFields: (params) => axios.get('/data-security/fields', { params }),

  // 获取敏感字段详情
  getSensitiveField: (id) => axios.get(`/data-security/fields/${id}`),

  // 创建敏感字段配置
  createSensitiveField: (data) => axios.post('/data-security/fields', data),

  // 更新敏感字段配置
  updateSensitiveField: (id, data) => axios.put(`/data-security/fields/${id}`, data),

  // 删除敏感字段配置
  deleteSensitiveField: (id) => axios.delete(`/data-security/fields/${id}`),
};
