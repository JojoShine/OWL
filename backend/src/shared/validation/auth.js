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
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': '请输入密码',
        'string.max': '密码过长',
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
      .min(1)
      .max(100)
      .required()
      .invalid(Joi.ref('oldPassword'))
      .messages({
        'string.min': '请输入新密码',
        'string.max': '新密码过长',
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
  changePassword,
};
