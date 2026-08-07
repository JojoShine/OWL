const Joi = require('joi');
const ApiError = require('../utils/ApiError');

/**
 * 请求验证中间件
 * @param {Object} schema - Joi验证schema对象 { body, query, params }
 * @returns {Function} Express中间件函数
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validSchema = {};
    const valueMap = {};

    ['params', 'query', 'body'].forEach((key) => {
      if (schema[key]) {
        validSchema[key] = req[key];
        valueMap[key] = true;
      }
    });

    const schemaObject = Joi.object(schema);
    const { value, error } = schemaObject.validate(validSchema, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(ApiError.validationError(errorMessage, error.details));
    }

    // 将验证后的值覆盖对应的req属性
    Object.keys(value).forEach((key) => {
      if (valueMap[key]) {
        req[key] = value[key];
      }
    });

    return next();
  };
};

module.exports = validate;