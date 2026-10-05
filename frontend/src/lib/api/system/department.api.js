import axios from '../../utils/http-client';

export const departmentApi = {
  // 获取部门树
  getDepartmentTree: () => axios.get('/departments/tree'),

  // 获取部门列表（分页）
  getDepartments: (params) => axios.get('/departments', { params }),

  // 获取部门详情
  getDepartment: (id) => axios.get(`/departments/${id}`),

  // 获取部门成员
  getDepartmentMembers: (id, params) => axios.get(`/departments/${id}/members`, { params }),

  // 创建部门
  createDepartment: (data) => axios.post('/departments', data),

  // 更新部门
  updateDepartment: (id, data) => axios.put(`/departments/${id}`, data),

  // 删除部门
  deleteDepartment: (id) => axios.delete(`/departments/${id}`),
};
