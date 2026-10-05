import axios from '../../utils/http-client';

// 通知API
export const notificationApi = {
  // 获取当前用户的通知列表
  getNotifications: (params) => axios.get('/notifications', { params }),

  // 获取未读消息数量
  getUnreadCount: () => axios.get('/notifications/unread-count'),

  // 获取通知统计
  getStats: () => axios.get('/notifications/stats'),

  // 获取通知详情
  getNotification: (id) => axios.get(`/notifications/${id}`),

  // 标记单条消息为已读
  markAsRead: (id) => axios.put(`/notifications/${id}/read`),

  // 标记所有消息为已读
  markAllAsRead: () => axios.put('/notifications/read-all'),

  // 删除单条通知
  deleteNotification: (id) => axios.delete(`/notifications/${id}`),

  // 清空所有已读消息
  clearReadNotifications: () => axios.delete('/notifications/clear'),

  // 发送通知（管理员功能）
  sendNotification: (data) => axios.post('/notifications/send', data),

  // 广播通知（管理员功能）
  broadcastNotification: (data) => axios.post('/notifications/broadcast', data),
};

// 邮件API
export const emailApi = {
  // 获取邮件发送记录
  getEmailLogs: (params) => axios.get('/notifications/emails/logs', { params }),

  // 发送邮件
  sendEmail: (data) => axios.post('/notifications/emails/send', data),

  // 使用模板发送邮件
  sendEmailWithTemplate: (data) => axios.post('/notifications/emails/send-with-template', data),

  // 发送测试邮件
  sendTestEmail: (toEmail) => axios.post('/notifications/emails/test', { toEmail }),
};

// 邮件模板API
export const emailTemplateApi = {
  // 获取邮件模板列表
  getTemplates: (params) => axios.get('/notifications/emails/templates', { params }),

  // 获取邮件模板详情
  getTemplate: (id) => axios.get(`/notifications/emails/templates/${id}`),

  // 创建邮件模板
  createTemplate: (data) => axios.post('/notifications/emails/templates', data),

  // 更新邮件模板
  updateTemplate: (id, data) => axios.put(`/notifications/emails/templates/${id}`, data),

  // 删除邮件模板
  deleteTemplate: (id) => axios.delete(`/notifications/emails/templates/${id}`),

  // 预览邮件模板
  previewTemplate: (id, payload) => axios.post(`/notifications/emails/templates/${id}/preview`, payload || {}),
};

// 通知设置API
export const notificationSettingsApi = {
  // 获取当前用户的通知设置
  getSettings: () => axios.get('/notifications/settings'),

  // 更新当前用户的通知设置
  updateSettings: (data) => axios.put('/notifications/settings', data),

  // 重置通知设置为默认值
  resetSettings: () => axios.post('/notifications/settings/reset'),
};