import axios from '../../utils/http-client';

// 邮件任务API
export const emailTaskApi = {
  // 获取邮件任务列表
  getTasks: (params) => axios.get('/email-tasks', { params }),

  // 获取邮件任务详情
  getTask: (id) => axios.get(`/email-tasks/${id}`),

  // 创建邮件任务
  createTask: (data) => axios.post('/email-tasks', data),

  // 更新邮件任务
  updateTask: (id, data) => axios.put(`/email-tasks/${id}`, data),

  // 删除邮件任务
  deleteTask: (id) => axios.delete(`/email-tasks/${id}`),

  // 启用邮件任务
  enableTask: (id) => axios.patch(`/email-tasks/${id}/enable`),

  // 禁用邮件任务
  disableTask: (id) => axios.patch(`/email-tasks/${id}/disable`),

  // 手动执行邮件任务
  executeTask: (id) => axios.post(`/email-tasks/${id}/execute`),
};
