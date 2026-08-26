import axios from '../../utils/http-client';

export const thirdPartyKeysApi = {
  // 获取第三方API密钥列表
  getKeys: (params) => axios.get('/third-party-keys', { params }),

  // 获取第三方API密钥详情
  getKey: (id) => axios.get(`/third-party-keys/${id}`),

  getScopes: () => axios.get('/third-party-keys/scopes'),

  // 创建第三方API密钥
  createKey: (data) => axios.post('/third-party-keys', data),

  // 更新第三方API密钥
  updateKey: (id, data) => axios.put(`/third-party-keys/${id}`, data),

  // 改变第三方API密钥状态
  changeStatus: (id, data) => axios.patch(`/third-party-keys/${id}/status`, data),

  // 重新生成第三方API密钥密码
  regenerateSecret: (id) => axios.post(`/third-party-keys/${id}/regenerate`),

  // 删除第三方API密钥
  deleteKey: (id) => axios.delete(`/third-party-keys/${id}`),
};
