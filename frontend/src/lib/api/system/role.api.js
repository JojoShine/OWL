import axios from '../../utils/http-client';

export const roleApi = {
  // 获取角色列表
  getRoles: (params) => axios.get('/roles', { params }),

  // 获取角色详情
  getRole: (id) => axios.get(`/roles/${id}`),

  // 创建角色
  createRole: (data) => axios.post('/roles', data),

  // 更新角色
  updateRole: (id, data) => axios.put(`/roles/${id}`, data),

  // 删除角色
  deleteRole: (id) => axios.delete(`/roles/${id}`),
};
