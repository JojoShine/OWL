import axios from '../../utils/http-client';

export const logApi = {
  // 获取操作日志
  getOperationLogs: (params) => axios.get('/logs/operations', { params }),

  // 获取登录日志
  getLoginLogs: (params) => axios.get('/logs/logins', { params }),

  // 获取系统日志
  getSystemLogs: (params) => axios.get('/logs/system', { params }),

  // 获取访问日志
  getAccessLogs: (params) => axios.get('/logs/access', { params }),

  // 获取错误日志
  getErrorLogs: (params) => axios.get('/logs/errors', { params }),

  // 获取数据库访问日志
  getDatabaseAccessLogs: (params) => axios.get('/logs/database', { params }),

  // 获取日志统计
  getLogStats: (params) => axios.get('/logs/stats', { params }),

  // 导出日志
  exportLogs: (data) => axios.post('/logs/export', data, { responseType: 'blob' }),
};
