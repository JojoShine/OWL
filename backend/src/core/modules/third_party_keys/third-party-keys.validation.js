const Joi = require('joi');
const { THIRD_PARTY_SCOPE_VALUES } = require('./third-party-scopes');

/**
 * 列表查询验证
 */
exports.listKeys = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(10),
    client_name: Joi.string().allow('').optional(),
    status: Joi.string().valid('active', 'inactive').allow('').optional(),
  }),
};

/**
 * 创建密钥验证
 */
exports.createKey = {
  body: Joi.object({
    client_name: Joi.string().required().min(2).max(255).messages({
      'string.empty': '客户端名称不能为空',
      'any.required': '客户端名称必填',
      'string.min': '客户端名称至少2个字符',
      'string.max': '客户端名称最多255个字符',
    }),
    description: Joi.string().allow('').optional().max(500).messages({
      'string.max': '描述最多500个字符',
    }),
    expires_at: Joi.date().allow(null).optional().messages({
      'date.base': '过期时间必须是有效的日期',
    }),
    remark: Joi.string().allow('').optional().max(500).messages({
      'string.max': '备注最多500个字符',
    }),
    scopes: Joi.array().items(Joi.string().valid(...THIRD_PARTY_SCOPE_VALUES)).min(1).required(),
  }).required(),
};

/**
 * 更新密钥验证
 */
exports.updateKey = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'ID格式不正确',
      'any.required': 'ID必填',
    }),
  }).required(),
  body: Joi.object({
    client_name: Joi.string().min(2).max(255).optional().messages({
      'string.min': '客户端名称至少2个字符',
      'string.max': '客户端名称最多255个字符',
    }),
    description: Joi.string().allow('').optional().max(500).messages({
      'string.max': '描述最多500个字符',
    }),
    remark: Joi.string().allow('').optional().max(500).messages({
      'string.max': '备注最多500个字符',
    }),
    expires_at: Joi.date().allow(null).optional(),
    scopes: Joi.array().items(Joi.string().valid(...THIRD_PARTY_SCOPE_VALUES)).min(1).optional(),
  }).required(),
};

/**
 * 修改状态验证
 */
exports.changeStatus = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }).required(),
  body: Joi.object({
    status: Joi.string().valid('active', 'inactive').required().messages({
      'string.empty': '状态不能为空',
      'any.only': '状态只能是 active 或 inactive',
      'any.required': '状态必填',
    }),
  }).required(),
};

/**
 * ID参数验证
 */
exports.keyId = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'ID格式不正确',
      'any.required': 'ID必填',
    }),
  }).required(),
};
