import axios from '../../utils/http-client';

export const generatorApi = {
  // 获取数据库表列表
  getTables: (params) => axios.get('/generator/tables', { params }),

  // 获取表结构详情
  getTableStructure: (tableName) => axios.get(`/generator/tables/${tableName}`),

  // 创建业务表并自动初始化生成配置
  createBusinessTable: (data) => axios.post('/generator/business-tables', data),

  // 获取模块配置列表
  getModuleConfigs: (params) => axios.get('/generator/configs', { params }),

  // 获取模块配置详情
  getModuleConfig: (id) => axios.get(`/generator/configs/${id}`),

  // 初始化模块配置（从表结构自动生成）
  initializeModuleConfig: (tableName) => axios.post('/generator/configs/initialize', { tableName }),

  // 创建模块配置
  createModuleConfig: (data) => axios.post('/generator/configs', data),

  // 更新模块配置
  updateModuleConfig: (id, data) => axios.put(`/generator/configs/${id}`, data),

  // 删除模块配置
  deleteModuleConfig: (id) => axios.delete(`/generator/configs/${id}`),

  // 生成代码
  generateCode: (moduleId, options) => axios.post(`/generator/generate/${moduleId}`, options),

  // 删除生成的代码
  deleteGeneratedCode: (moduleId) => axios.delete(`/generator/generate/${moduleId}`),

  // 获取生成历史列表
  getHistoryList: (params) => axios.get('/generator/history', { params }),

  // 获取生成历史详情
  getHistory: (id) => axios.get(`/generator/history/${id}`),

  // 获取模块的生成历史
  getModuleHistory: (moduleId, params) => axios.get(`/generator/configs/${moduleId}/history`, { params }),

  // 获取统计信息
  getStatistics: (params) => axios.get('/generator/statistics', { params }),

  // 清理历史记录
  cleanupHistory: (daysToKeep) => axios.delete('/generator/history/cleanup', { data: { daysToKeep } }),

  // 验证SQL语法
  validateSql: (sql) => axios.post('/generator/validate-sql', { sql }).then(res => res.data),

  // 预览SQL查询结果
  previewSql: (sql, limit = 10) => axios.post('/generator/preview-sql', { sql, limit }).then(res => res.data),

  // 从SQL生成字段配置
  generateFieldsFromSql: (sql) => axios.post('/generator/generate-fields-from-sql', { sql }).then(res => res.data),

  // 根据模块路径获取页面配置
  getPageConfigByPath: (modulePath) => axios.get(`/generator/page-config/${modulePath}`).then(res => res.data),

  // 检查表审计字段缺失情况
  checkAuditFields: (tableName) => axios.get(`/generator/tables/${tableName}/audit-check`).then(res => res.data),

  // 一键补全表审计字段
  addAuditFields: (tableName) => axios.post(`/generator/tables/${tableName}/add-audit-fields`).then(res => res.data),
};
