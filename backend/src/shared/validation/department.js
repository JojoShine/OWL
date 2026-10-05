const Joi = require('joi');

/**
 * 获取部门列表验证
 */
const getDepartments = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow(''),
    status: Joi.string().valid('active', 'inactive'),
    parent_id: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.string().valid('null')
    ),
    sort: Joi.string().valid('sort', 'created_at', 'name').default('sort'),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC'),
  }),
};

/**
 * 获取部门详情验证
 */
const getDepartmentById = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 创建部门验证
 */
const createDepartment = {
  body: Joi.object({
    parent_id: Joi.string().uuid().allow(null),
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': '部门名称至少2个字符',
        'string.max': '部门名称最多100个字符',
        'any.required': '部门名称是必填项',
      }),
    code: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[A-Za-z0-9_-]+$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': '部门代码只能包含字母、数字、下划线和连字符',
      }),
    leader_id: Joi.string().uuid().allow(null),
    description: Joi.string()
      .max(500)
      .allow(null, ''),
    sort: Joi.number()
      .integer()
      .min(0)
      .default(0),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active'),
  }),
};

/**
 * 更新部门验证
 */
const updateDepartment = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    parent_id: Joi.string().uuid().allow(null),
    name: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': '部门名称至少2个字符',
        'string.max': '部门名称最多100个字符',
      }),
    code: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[A-Za-z0-9_-]+$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': '部门代码只能包含字母、数字、下划线和连字符',
      }),
    leader_id: Joi.string().uuid().allow(null),
    description: Joi.string()
      .max(500)
      .allow(null, ''),
    sort: Joi.number()
      .integer()
      .min(0),
    status: Joi.string()
      .valid('active', 'inactive'),
  }).min(1),
};

/**
 * 删除部门验证
 */
const deleteDepartment = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};