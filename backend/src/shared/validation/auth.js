const Joi = require('joi');

/**
 * 注册验证
 */
const register = {
  body: Joi.object({
    username: Joi.string()
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.pattern.base': '用户名只能包含字母、数字、下划线和连字符',
        'string.min': '用户名至少3个字符',
        'string.max': '用户名最多50个字符',
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
        'string.max': '密码最多50个字符',
      }),
    real_name: Joi.string()
      .max(50)
      .allow(null, '')
      .messages({
        'string.max': '真实姓名最多50个字符',
      }),
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .required()
      .messages({
        'string.pattern.base': '请提供有效的手机号码',
        'any.required': '手机号是必填项',
      }),
  }),
};

/**
 * 登录验证
 */
const login = {
  body: Joi.object({
    username: Joi.string()
      .required()
      .messages({
        'any.required': '用户名是必填项',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': '密码是必填项',
      }),
    captchaId: Joi.string()
      .required()
      .messages({
        'any.required': '验证码ID是必填项',
      }),
    captchaCode: Joi.string()
      .min(1)
      .max(3)
      .pattern(/^-?\d+$/)
      .required()
      .messages({
        'string.min': '请输入计算结果',
        'string.max': '计算结果不能超过3位数',
        'string.pattern.base': '请输入有效的数字',
        'any.required': '验证码是必填项',
      }),
  }),
};

/**
 * 修改密码验证
 */
const changePassword = {
  body: Joi.object({
    oldPassword: Joi.string()
      .required()
      .messages({
        'any.required': '原密码是必填项',
      }),
    newPassword: Joi.string()
      .min(6)
      .max(50)
      .required()
      .invalid(Joi.ref('oldPassword'))
      .messages({
        'string.min': '新密码至少6个字符',
        'string.max': '新密码最多50个字符',
        'any.required': '新密码是必填项',
        'any.invalid': '新密码不能与原密码相同',
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': '两次输入的密码不一致',
        'any.required': '确认密码是必填项',
      }),
  }),
};

module.exports = {
  register,
  login,
  changePassword,
};
