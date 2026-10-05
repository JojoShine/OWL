const Joi = require('joi');

/**
 * 获取权限列表验证
 */
const getPermissions = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow(''),
    resource: Joi.string().allow(''),
    action: Joi.string().allow(''),
    category: Joi.string().allow(''),
    sort: Joi.string().valid('category', 'resource', 'action', 'created_at').default('category'),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC'),
  }),
};

/**
 * 获取权限详情验证
 */
const getPermissionById = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 创建权限验证
 */
const createPermission = {
  body: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': '权限名称至少2个字符',
        'any.required': '权限名称是必填项',
      }),
    code: Joi.string()
      .pattern(/^[a-z_:]+$/)
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.pattern.base': '权限代码格式为：resource:action（如：user:create）',
        'any.required': '权限代码是必填项',
      }),
    resource: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'any.required': '资源名称是必填项',
      }),
    action: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'any.required': '操作类型是必填项',
      }),
    description: Joi.string()
      .max(255)
      .allow(null, ''),
    category: Joi.string()
      .max(50)
      .allow(null, ''),
  }),
};

/**
 * 更新权限验证
 */
const updatePermission = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(2).max(50),
    code: Joi.string().pattern(/^[a-z_:]+$/).min(2).max(50),
    resource: Joi.string().min(2).max(50),
    action: Joi.string().min(2).max(50),
    description: Joi.string().max(255).allow(null, ''),
    category: Joi.string().max(50).allow(null, ''),
  }).min(1),
};

/**
 * 删除权限验证
 */
const deletePermission = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
};
