import axios from '../../utils/http-client';

export const menuApi = {
  // 获取菜单树
  getMenuTree: () => axios.get('/menus/tree'),

  // 获取用户菜单树（根据用户权限）
  getUserMenus: () => axios.get('/menus/user-tree'),

  // 获取菜单列表（分页）
  getMenus: (params) => axios.get('/menus', { params }),

  // 获取菜单详情
  getMenu: (id) => axios.get(`/menus/${id}`),

  // 创建菜单
  createMenu: (data) => axios.post('/menus', data),

  // 更新菜单
  updateMenu: (id, data) => axios.put(`/menus/${id}`, data),

  // 删除菜单
  deleteMenu: (id) => axios.delete(`/menus/${id}`),

  // 预览菜单将要生成的权限
  previewPermissions: (data) => axios.post('/menus/preview-permissions', data),
};
