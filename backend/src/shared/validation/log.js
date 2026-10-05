const Joi = require('joi');

/**
 * 日志查询验证
 */
const queryLogs = {
  query: Joi.object({
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('').optional(),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('').optional(),
    userId: Joi.string().uuid().allow('').optional(),
    username: Joi.string().allow('').optional(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').allow('').optional(),
    url: Joi.string().allow('').optional(),
    status: Joi.string().valid('success', 'failure').allow('').optional(),
    action: Joi.string().valid('login', 'logout').allow('').optional(),
    dbType: Joi.string().valid('redis', 'postgresql').allow('').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(50),
  }),
};

/**
 * 统计查询验证
 */
const queryStats = {
  query: Joi.object({
    type: Joi.string().valid('operation', 'login', 'system', 'access', 'error', 'database').required(),
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('').optional(),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('').optional(),
  }),
};

/**
 * 导出日志验证
 */
const exportLogs = {
  body: Joi.object({
    type: Joi.string().valid('operation', 'login', 'system', 'access', 'error', 'database').required(),
    format: Joi.string().valid('json', 'csv').default('json'),
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('').optional(),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('').optional(),
    userId: Joi.string().uuid().allow('').optional(),
    username: Joi.string().allow('').optional(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').allow('').optional(),
    url: Joi.string().allow('').optional(),
    status: Joi.string().valid('success', 'failure').allow('').optional(),
    action: Joi.string().valid('login', 'logout').allow('').optional(),
    dbType: Joi.string().valid('redis', 'postgresql').allow('').optional(),
  }),
};

module.exports = {
  queryLogs,
  queryStats,
  exportLogs,
};
