const Joi = require('joi');

/**
 * 获取用户列表验证
 */
const getUsers = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow(''),
    status: Joi.string().valid('active', 'inactive', 'banned'),
    role_id: Joi.string().uuid(),
    sort: Joi.string().valid('created_at', 'username', 'email').default('created_at'),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
  }),
};

/**
 * 获取用户详情验证
 */
const getUserById = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': '无效的用户ID',
      'any.required': '用户ID是必填项',
    }),
  }),
};

/**
 * 创建用户验证
 */
const createUser = {
  body: Joi.object({
    username: Joi.string()
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.pattern.base': '用户名只能包含字母、数字、下划线和连字符',
        'string.min': '用户名至少3个字符',
        'any.required': '用户名是必填项',
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请提供有效的邮箱地址',
        'any.required': '邮箱是必填项',
      }),
    password: Joi.string()
      .min(6)
      .max(50)
      .allow(null, '')
      .messages({
        'string.min': '密码至少6个字符',
      }),
    real_name: Joi.string()
      .max(50)
      .allow(null, ''),
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .required()
      .messages({
        'string.pattern.base': '请提供有效的手机号码',
        'any.required': '手机号是必填项',
      }),
    status: Joi.string()
      .valid('active', 'inactive', 'banned')
      .default('active'),
    access_level: Joi.string()
      .valid('ALL', 'DEPARTMENT', 'SELF')
      .default('SELF'),
    role_ids: Joi.array()
      .items(Joi.string().uuid())
      .default([]),
  }),
};

/**
 * 更新用户验证
 */
const updateUser = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    username: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(3).max(50),
    email: Joi.string().email(),
    password: Joi.string()
      .min(6)
      .max(50)
      .allow(null, '')
      .messages({
        'string.min': '密码至少6个字符',
      }),
    real_name: Joi.string().max(50).allow(null, ''),
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .allow(null, ''),
    avatar: Joi.string().uri().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'banned'),
    access_level: Joi.string().valid('ALL', 'DEPARTMENT', 'SELF'),
    role_ids: Joi.array().items(Joi.string().uuid()),
  }).min(1), // 至少要有一个字段
};

/**
 * 删除用户验证
 */
const deleteUser = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 重置密码验证
 */
const resetPassword = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    password: Joi.string()
      .min(6)
      .max(50)
      .required()
      .messages({
        'string.min': '密码至少6个字符',
        'any.required': '密码是必填项',
      }),
  }),
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
};
