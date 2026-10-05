const Joi = require('joi');

/**
 * 上传文件验证
 */
const uploadFile = {
  body: Joi.object({
    category: Joi.string()
      .valid('logo', 'background', 'normal')
      .default('normal'),
  }),
};

module.exports = {
  uploadFile,
};
