import axios from '../../utils/http-client';

export const userApi = {
  // 获取用户列表
  getUsers: (params, config) => axios.get('/users', { params, ...config }),

  // 获取用户详情
  getUser: (id) => axios.get(`/users/${id}`),

  // 创建用户
  createUser: (data, config) => axios.post('/users', data, config),

  // 更新用户
  updateUser: (id, data, config) => axios.put(`/users/${id}`, data, config),

  // 删除用户
  deleteUser: (id, config) => axios.delete(`/users/${id}`, config),
};
