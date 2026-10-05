import axios from '../../utils/http-client';

export const permissionApi = {
  // 获取权限列表
  getPermissions: (params) => axios.get('/permissions', { params }),

  // 获取所有权限（不分页）
  getAllPermissions: () => axios.get('/permissions/all'),

  // 获取权限树
  getPermissionTree: () => axios.get('/permissions/tree'),
};