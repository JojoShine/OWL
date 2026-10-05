const Joi = require('joi');

/**
 * 发送验证码验证
 */
const sendCode = {
  body: Joi.object({
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .required()
      .messages({
        'string.pattern.base': '请输入正确的手机号',
        'any.required': '手机号是必填项',
      }),
  }),
};

/**
 * 短信登录验证
 */
const login = {
  body: Joi.object({
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .required()
      .messages({
        'string.pattern.base': '请输入正确的手机号',
        'any.required': '手机号是必填项',
      }),
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.length': '验证码必须是6位数字',
        'string.pattern.base': '验证码格式不正确',
        'any.required': '验证码是必填项',
      }),
  }),
};

/**
 * 短信注册验证
 */
const register = {
  body: Joi.object({
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .required()
      .messages({
        'string.pattern.base': '请输入正确的手机号',
        'any.required': '手机号是必填项',
      }),
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.length': '验证码必须是6位数字',
        'string.pattern.base': '验证码格式不正确',
        'any.required': '验证码是必填项',
      }),
    real_name: Joi.string()
      .max(50)
      .allow(null, '')
      .messages({
        'string.max': '真实姓名最多50个字符',
      }),
  }),
};

module.exports = {
  sendCode,
  login,
  register,
};
