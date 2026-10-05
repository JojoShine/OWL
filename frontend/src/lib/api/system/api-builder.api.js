import axios from '../../utils/http-client';

export const apiBuilderApi = {
  // 获取接口列表
  getInterfaces: (params = {}) => axios.get('/api-builder', { params }),

  // 获取接口详情
  getInterfaceById: (id) => axios.get(`/api-builder/${id}`),

  // 创建接口
  createInterface: (data) => axios.post('/api-builder', data),

  // 更新接口
  updateInterface: (id, data) => axios.put(`/api-builder/${id}`, data),

  // 删除接口
  deleteInterface: (id) => axios.delete(`/api-builder/${id}`),

  // 测试接口
  testInterface: (id, params = {}) => axios.post(`/api-builder/test/${id}`, { params }),

  // 创建可授权多个 SQL 接口的调用密钥
  createApiKey: (data) => axios.post('/api-builder/keys', data),

  // 获取某个 SQL 接口已授权的密钥
  getInterfaceKeys: (interfaceId) => axios.get('/api-builder/keys', { params: { interface_id: interfaceId } }),

  // 删除API密钥
  deleteApiKey: (keyId) => axios.delete(`/api-builder/keys/${keyId}`),

  // 重新生成API密钥
  regenerateApiKey: (keyId) => axios.post(`/api-builder/keys/${keyId}/regenerate`),

  changeApiKeyStatus: (keyId, status) => axios.patch(`/api-builder/keys/${keyId}/status`, { status }),

  // 获取所有API密钥
  getAllApiKeys: (params = {}) => axios.get('/api-builder/keys', { params }),

  // 更新API密钥信息
  updateApiKey: (id, data) => axios.put(`/api-builder/keys/${id}`, data),

  // 测试SQL查询
  testSql: (sql_query, parameters = {}) =>
    axios.post('/api-builder/test-sql', { sql_query, parameters }),

  // 执行SQL查询（实际执行，用于自定义API）
  executeSql: (sql_query, parameters = {}) =>
    axios.post('/api-builder/execute-sql', { sql_query, parameters }),

  // 执行动态接口
  executeCustomApi: (endpoint, params = {}, apiKey = null) => {
    const config = {};
    if (apiKey) {
      config.headers = { 'X-API-Key': apiKey };
    }
    return axios.get(`/api-builder/custom/${endpoint}`, { params, ...config });
  },
};
