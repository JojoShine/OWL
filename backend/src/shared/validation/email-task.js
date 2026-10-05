const Joi = require('joi');

module.exports = {
  /**
   * 获取邮件任务列表
   */
  listTasks: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      enabled: Joi.boolean(),
    }),
  },

  /**
   * 创建邮件任务
   */
  createTask: {
    body: Joi.object({
      name: Joi.string().max(100).required().messages({
        'string.empty': '任务名称不能为空',
        'string.max': '任务名称最多100个字符',
      }),
      description: Joi.string().max(500),
      template_id: Joi.string().uuid().required().messages({
        'string.guid': '邮件模板ID格式不正确',
      }),
      recipients: Joi.string().required().messages({
        'string.empty': '收件人邮箱不能为空',
      }),
      frequency: Joi.string()
        .valid('once', 'hourly', 'daily', 'weekly', 'monthly')
        .default('once')
        .messages({
          'any.only': '发送频率只能是: once, hourly, daily, weekly, monthly',
        }),
      enabled: Joi.boolean().default(true),
      template_variables: Joi.object().default({}),
    }).required(),
  },

  /**
   * 更新邮件任务
   */
  updateTask: {
    body: Joi.object({
      name: Joi.string().max(100),
      description: Joi.string().max(500),
      template_id: Joi.string().uuid().messages({
        'string.guid': '邮件模板ID格式不正确',
      }),
      recipients: Joi.string(),
      frequency: Joi.string()
        .valid('once', 'hourly', 'daily', 'weekly', 'monthly')
        .messages({
          'any.only': '发送频率只能是: once, hourly, daily, weekly, monthly',
        }),
      enabled: Joi.boolean(),
      template_variables: Joi.object(),
    }).min(1).required(),
  },
};
