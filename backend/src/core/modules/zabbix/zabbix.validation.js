/**
 * Zabbix实例参数校验
 * 模块归属：Zabbix集成模块
 * 使用场景：Zabbix实例相关接口的请求参数校验
 */
const Joi = require('joi');

/**
 * 列表查询验证
 */
exports.listInstances = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(10),
    name: Joi.string().allow('').optional(),
    status: Joi.string().valid('active', 'inactive').allow('').optional(),
  }),
};

/**
 * 创建实例验证
 */
exports.createInstance = {
  body: Joi.object({
    name: Joi.string().required().min(2).max(100).messages({
      'string.empty': '实例名称不能为空',
      'any.required': '实例名称必填',
      'string.min': '实例名称至少2个字符',
      'string.max': '实例名称最多100个字符',
    }),
    url: Joi.string().uri({ scheme: ['http', 'https'] }).required().messages({
      'string.uri': 'URL格式不正确，需以http://或https://开头',
      'any.required': 'Zabbix URL必填',
    }),
    api_token: Joi.string().required().min(10).messages({
      'string.empty': 'API Token不能为空',
      'any.required': 'API Token必填',
      'string.min': 'API Token格式不正确',
    }),
    sync_interval: Joi.number().integer().min(10).max(3600).default(60).messages({
      'number.min': '同步间隔最少10秒',
      'number.max': '同步间隔最多3600秒',
    }),
    description: Joi.string().allow('').optional().max(500).messages({
      'string.max': '描述最多500个字符',
    }),
  }).required(),
};

/**
 * 更新实例验证
 */
exports.updateInstance = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'ID格式不正确',
      'any.required': 'ID必填',
    }),
  }).required(),
  body: Joi.object({
    name: Joi.string().min(2).max(100).optional().messages({
      'string.min': '实例名称至少2个字符',
      'string.max': '实例名称最多100个字符',
    }),
    url: Joi.string().uri({ scheme: ['http', 'https'] }).optional().messages({
      'string.uri': 'URL格式不正确',
    }),
    api_token: Joi.string().min(10).optional().messages({
      'string.min': 'API Token格式不正确',
    }),
    sync_interval: Joi.number().integer().min(10).max(3600).optional().messages({
      'number.min': '同步间隔最少10秒',
      'number.max': '同步间隔最多3600秒',
    }),
    description: Joi.string().allow('').optional().max(500).messages({
      'string.max': '描述最多500个字符',
    }),
    status: Joi.string().valid('active', 'inactive').optional().messages({
      'any.only': '状态只能是 active 或 inactive',
    }),
  }).required(),
};

/**
 * ID参数验证
 */
exports.instanceId = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'ID格式不正确',
      'any.required': 'ID必填',
    }),
  }).required(),
};

/**
 * 主机列表查询验证
 */
exports.hostList = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': '实例ID格式不正确',
      'any.required': '实例ID必填',
    }),
  }).required(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    name: Joi.string().allow('').optional(),
  }),
};

/**
 * 问题列表查询验证
 */
exports.problemList = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': '实例ID格式不正确',
      'any.required': '实例ID必填',
    }),
  }).required(),
  query: Joi.object({
    hostids: Joi.string().optional(),
    severity_min: Joi.number().integer().min(0).max(5).optional(),
    limit: Joi.number().integer().min(1).max(500).default(50),
  }),
};
