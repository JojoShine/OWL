import axios from '../../utils/http-client';

export const jobApi = {
  // 获取任务列表
  getJobs: (params) => axios.get('/jobs', { params }),

  // 获取任务详情
  getJob: (id) => axios.get(`/jobs/${id}`),

  // 创建任务
  createJob: (data) => axios.post('/jobs', data),

  // 更新任务
  updateJob: (id, data) => axios.put(`/jobs/${id}`, data),

  // 删除任务
  deleteJob: (id) => axios.delete(`/jobs/${id}`),

  // 执行任务
  runJob: (id) => axios.post(`/jobs/${id}/run`),

  // 获取任务日志
  getJobLogs: (id, params) => axios.get(`/jobs/${id}/logs`, { params }),
};