const Joi = require('joi');

/**
 * 获取角色列表验证
 */
const getRoles = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow(''),
    status: Joi.string().valid('active', 'inactive'),
    sort: Joi.string().valid('sort', 'created_at', 'name').default('sort'),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC'),
  }),
};

/**
 * 获取角色详情验证
 */
const getRoleById = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 创建角色验证
 */
const createRole = {
  body: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': '角色名称至少2个字符',
        'any.required': '角色名称是必填项',
      }),
    code: Joi.string()
      .pattern(/^[a-z_]+$/)
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.pattern.base': '角色代码只能包含小写字母和下划线',
        'any.required': '角色代码是必填项',
      }),
    description: Joi.string()
      .max(255)
      .allow(null, ''),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active'),
    sort: Joi.number()
      .integer()
      .min(0)
      .default(0),
    permission_ids: Joi.array()
      .items(Joi.string().uuid())
      .default([]),
    menu_ids: Joi.array()
      .items(Joi.string().uuid())
      .default([]),
  }),
};

/**
 * 更新角色验证
 */
const updateRole = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(2).max(50),
    code: Joi.string().pattern(/^[a-z_]+$/).min(2).max(50),
    description: Joi.string().max(255).allow(null, ''),
    status: Joi.string().valid('active', 'inactive'),
    sort: Joi.number().integer().min(0),
    permission_ids: Joi.array().items(Joi.string().uuid()),
    menu_ids: Joi.array().items(Joi.string().uuid()),
  }).min(1),
};

/**
 * 删除角色验证
 */
const deleteRole = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
