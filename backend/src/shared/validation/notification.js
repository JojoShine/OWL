const Joi = require('joi');

/**
 * 获取通知列表验证
 */
const getNotifications = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().valid('info', 'system', 'warning', 'error', 'success'),
    isRead: Joi.boolean(),
  }),
};

/**
 * 获取通知详情验证
 */
const getNotificationById = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': '无效的通知ID',
      'any.required': '通知ID是必填项',
    }),
  }),
};

/**
 * 标记已读验证
 */
const markAsRead = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 删除通知验证
 */
const deleteNotification = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 发送通知验证（管理员）
 */
const sendNotification = {
  body: Joi.object({
    user_id: Joi.string().uuid().required().messages({
      'any.required': '用户ID是必填项',
    }),
    title: Joi.string().max(255).required().messages({
      'any.required': '标题是必填项',
    }),
    content: Joi.string().allow(null, ''),
    type: Joi.string()
      .valid('info', 'system', 'warning', 'error', 'success')
      .default('info'),
    link: Joi.string().uri().allow(null, ''),
  }),
};

/**
 * 广播通知验证（管理员）
 */
const broadcastNotification = {
  body: Joi.object({
    title: Joi.string().max(255).required().messages({
      'any.required': '标题是必填项',
    }),
    content: Joi.string().allow(null, ''),
    type: Joi.string()
      .valid('info', 'system', 'warning', 'error', 'success')
      .default('system'),
    link: Joi.string().uri().allow(null, ''),
  }),
};

/**
 * 获取邮件日志验证
 */
const getEmailLogs = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'sent', 'failed'),
    toEmail: Joi.string().email(),
  }),
};

/**
 * 发送邮件验证
 */
const sendEmail = {
  body: Joi.object({
    to: Joi.string().email().required().messages({
      'any.required': '收件人邮箱是必填项',
      'string.email': '请提供有效的邮箱地址',
    }),
    subject: Joi.string().max(255).required().messages({
      'any.required': '邮件主题是必填项',
    }),
    html: Joi.string().allow(null, ''),
    text: Joi.string().allow(null, ''),
  }),
};

/**
 * 使用模板发送邮件验证
 */
const sendEmailWithTemplate = {
  body: Joi.object({
    to: Joi.string().email().required().messages({
      'any.required': '收件人邮箱是必填项',
    }),
    templateName: Joi.string().required().messages({
      'any.required': '模板名称是必填项',
    }),
    variables: Joi.object().default({}),
  }),
};

/**
 * 测试邮件验证
 */
const sendTestEmail = {
  body: Joi.object({
    toEmail: Joi.string().email().required().messages({
      'any.required': '测试邮箱是必填项',
      'string.email': '请提供有效的邮箱地址',
    }),
  }),
};

/**
 * 创建邮件模板验证
 */
const createEmailTemplate = {
  body: Joi.object({
    name: Joi.string().max(100).required().messages({
      'any.required': '模板名称是必填项',
    }),
    subject: Joi.string().max(255).required().messages({
      'any.required': '邮件主题是必填项',
    }),
    content: Joi.string().required().messages({
      'any.required': '模板内容是必填项',
    }),
    description: Joi.string().allow(null, ''),
  }),
};

/**
 * 更新邮件模板验证
 */
const updateEmailTemplate = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().max(100),
    subject: Joi.string().max(255),
    content: Joi.string(),
    description: Joi.string().allow(null, ''),
  }).min(1),
};

/**
 * 删除邮件模板验证
 */
const deleteEmailTemplate = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 预览邮件模板验证
 */
const previewEmailTemplate = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    title: Joi.string().allow(null, ''),
    content: Joi.string().allow(null, ''),
  }),
};

/**
 * 更新通知设置验证
 */
const updateNotificationSettings = {
  body: Joi.object({
    email_enabled: Joi.boolean(),
    push_enabled: Joi.boolean(),
    system_notification: Joi.boolean(),
    warning_notification: Joi.boolean(),
    error_notification: Joi.boolean(),
  }).min(1),
};

module.exports = {
  getNotifications,
  getNotificationById,
  markAsRead,
  deleteNotification,
  sendNotification,
  broadcastNotification,
  getEmailLogs,
  sendEmail,
  sendEmailWithTemplate,
  sendTestEmail,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate,
  updateNotificationSettings,
};
