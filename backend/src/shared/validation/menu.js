const Joi = require('joi');

/**
 * 获取菜单列表验证
 */
const getMenus = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow(''),
    type: Joi.string().valid('menu', 'button', 'link'),
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
 * 获取菜单详情验证
 */
const getMenuById = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 创建菜单验证
 */
const createMenu = {
  body: Joi.object({
    parent_id: Joi.string().uuid().allow(null),
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': '菜单名称至少2个字符',
        'any.required': '菜单名称是必填项',
      }),
    path: Joi.string()
      .max(255)
      .allow(null, ''),
    component: Joi.string()
      .max(255)
      .allow(null, ''),
    icon: Joi.string()
      .max(50)
      .allow(null, ''),
    type: Joi.string()
      .valid('menu', 'button', 'link')
      .default('menu'),
    visible: Joi.boolean()
      .default(true),
    sort: Joi.number()
      .integer()
      .min(0)
      .default(0),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active'),
    permission_code: Joi.string()
      .max(50)
      .allow(null, ''),
  }),
};

/**
 * 更新菜单验证
 */
const updateMenu = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    parent_id: Joi.string().uuid().allow(null),
    name: Joi.string().min(2).max(50),
    path: Joi.string().max(255).allow(null, ''),
    component: Joi.string().max(255).allow(null, ''),
    icon: Joi.string().max(50).allow(null, ''),
    type: Joi.string().valid('menu', 'button', 'link'),
    visible: Joi.boolean(),
    sort: Joi.number().integer().min(0),
    status: Joi.string().valid('active', 'inactive'),
    permission_code: Joi.string().max(50).allow(null, ''),
  }).min(1),
};

/**
 * 删除菜单验证
 */
const deleteMenu = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports = {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
};
