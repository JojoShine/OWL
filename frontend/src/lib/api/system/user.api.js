import axios from '../../utils/http-client';

export const userApi = {
  // 获取用户列表
  getUsers: (params) => axios.get('/users', { params }),

  // 获取用户详情
  getUser: (id) => axios.get(`/users/${id}`),

  // 创建用户
  createUser: (data) => axios.post('/users', data),

  // 更新用户
  updateUser: (id, data) => axios.put(`/users/${id}`, data),

  // 删除用户
  deleteUser: (id) => axios.delete(`/users/${id}`),
};
