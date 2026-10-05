import axios from '../../utils/http-client';

// 监控API
export const monitorApi = {
  // 获取系统服务状态（Redis、邮件等）
  getSystemStatus: () => axios.get('/monitor/status'),

  // 获取系统性能指标
  getSystemMetrics: () => axios.get('/monitor/system'),

  // 获取应用指标
  getApplicationMetrics: () => axios.get('/monitor/application'),

  // 获取数据库指标
  getDatabaseMetrics: () => axios.get('/monitor/database'),

  // 获取缓存指标
  getCacheMetrics: () => axios.get('/monitor/cache'),

  // 获取所有指标（综合）
  getAllMetrics: () => axios.get('/monitor/all'),
};

// 接口监控API
export const apiMonitorApi = {
  // 获取所有监控配置列表
  getAllMonitors: (params) => axios.get('/monitor/apis', { params }),

  // 根据 ID 获取监控配置
  getMonitorById: (id) => axios.get(`/monitor/apis/${id}`),

  // 创建监控配置
  createMonitor: (data) => axios.post('/monitor/apis', data),

  // 更新监控配置
  updateMonitor: (id, data) => axios.put(`/monitor/apis/${id}`, data),

  // 删除监控配置
  deleteMonitor: (id) => axios.delete(`/monitor/apis/${id}`),

  // 立即测试接口
  testApi: (id) => axios.post(`/monitor/apis/${id}/test`),

  // 获取监控日志
  getMonitorLogs: (id, params) => axios.get(`/monitor/apis/${id}/logs`, { params }),

  // 获取监控统计信息
  getMonitorStats: (id, params) => axios.get(`/monitor/apis/${id}/stats`, { params }),
};

// 告警API
export const alertApi = {
  // 获取所有告警规则
  getAllRules: (params) => axios.get('/monitor/alerts/rules', { params }),

  // 根据 ID 获取告警规则
  getRuleById: (id) => axios.get(`/monitor/alerts/rules/${id}`),

  // 创建告警规则
  createRule: (data) => axios.post('/monitor/alerts/rules', data),

  // 更新告警规则
  updateRule: (id, data) => axios.put(`/monitor/alerts/rules/${id}`, data),

  // 删除告警规则
  deleteRule: (id) => axios.delete(`/monitor/alerts/rules/${id}`),

  // 获取告警历史
  getAlertHistory: (params) => axios.get('/monitor/alerts/history', { params }),

  // 标记告警为已解决
  resolveAlert: (id) => axios.put(`/monitor/alerts/history/${id}/resolve`),

  // 获取告警统计
  getAlertStats: (params) => axios.get('/monitor/alerts/stats', { params }),

  // 手动触发告警检查
  triggerCheck: () => axios.post('/monitor/alerts/check'),
};

// 服务器监控API
export const serverMonitorApi = {
  // 获取所有服务器列表
  getAllServers: (params) => axios.get('/monitor/servers', { params }),

  // 根据 ID 获取服务器详情
  getServerById: (id) => axios.get(`/monitor/servers/${id}`),

  // 创建服务器监控配置
  createServer: (data) => axios.post('/monitor/servers', data),

  // 更新服务器监控配置
  updateServer: (id, data) => axios.put(`/monitor/servers/${id}`, data),

  // 删除服务器监控配置
  deleteServer: (id) => axios.delete(`/monitor/servers/${id}`),

  // 测试服务器连接（SSH）
  testConnection: (id) => axios.post(`/monitor/servers/${id}/test`),

  // 手动触发检查（采集指标）
  triggerCheck: (id) => axios.post(`/monitor/servers/${id}/check`),

  // 获取服务器监控日志
  getServerLogs: (id, params) => axios.get(`/monitor/servers/${id}/logs`, { params }),

  // 启动/停止服务器监控
  toggleMonitoring: (id) => axios.post(`/monitor/servers/${id}/toggle`),

  // 添加服务端口
  addPort: (serverId, data) => axios.post(`/monitor/servers/${serverId}/ports`, data),

  // 更新服务端口
  updatePort: (portId, data) => axios.put(`/monitor/ports/${portId}`, data),

  // 删除服务端口
  deletePort: (portId) => axios.delete(`/monitor/ports/${portId}`),
};
