/**
 * 权限常量定义
 * 用于前端权限检查和按钮显示控制
 *
 * 注：后端使用 accesscontrol，仅支持 CRUD 操作
 * - create: 新增
 * - read: 查看/读取
 * - update: 编辑/更新
 * - delete: 删除
 */

// 系统管理权限
export const SYSTEM_PERMISSIONS = {
  // 用户管理
  USER_CREATE: { resource: 'users', action: 'create' },
  USER_READ: { resource: 'users', action: 'read' },
  USER_UPDATE: { resource: 'users', action: 'update' },
  USER_DELETE: { resource: 'users', action: 'delete' },

  // 角色管理
  ROLE_CREATE: { resource: 'roles', action: 'create' },
  ROLE_READ: { resource: 'roles', action: 'read' },
  ROLE_UPDATE: { resource: 'roles', action: 'update' },
  ROLE_DELETE: { resource: 'roles', action: 'delete' },

  // 权限管理
  PERMISSION_CREATE: { resource: 'permissions', action: 'create' },
  PERMISSION_READ: { resource: 'permissions', action: 'read' },
  PERMISSION_UPDATE: { resource: 'permissions', action: 'update' },
  PERMISSION_DELETE: { resource: 'permissions', action: 'delete' },

  // 菜单管理
  MENU_CREATE: { resource: 'menus', action: 'create' },
  MENU_READ: { resource: 'menus', action: 'read' },
  MENU_UPDATE: { resource: 'menus', action: 'update' },
  MENU_DELETE: { resource: 'menus', action: 'delete' },

  // 部门管理
  DEPARTMENT_CREATE: { resource: 'departments', action: 'create' },
  DEPARTMENT_READ: { resource: 'departments', action: 'read' },
  DEPARTMENT_UPDATE: { resource: 'departments', action: 'update' },
  DEPARTMENT_DELETE: { resource: 'departments', action: 'delete' },

  // 文件管理
  FILE_CREATE: { resource: 'files', action: 'create' },
  FILE_READ: { resource: 'files', action: 'read' },
  FILE_UPDATE: { resource: 'files', action: 'update' },
  FILE_DELETE: { resource: 'files', action: 'delete' },

  // 文件夹管理
  FOLDER_CREATE: { resource: 'folders', action: 'create' },
  FOLDER_READ: { resource: 'folders', action: 'read' },
  FOLDER_UPDATE: { resource: 'folders', action: 'update' },
  FOLDER_DELETE: { resource: 'folders', action: 'delete' },
};

// 业务模块权限（示例）
export const BUSINESS_PERMISSIONS = {
  // 订单管理
  ORDER_CREATE: { resource: 'orders', action: 'create' },
  ORDER_READ: { resource: 'orders', action: 'read' },
  ORDER_UPDATE: { resource: 'orders', action: 'update' },
  ORDER_DELETE: { resource: 'orders', action: 'delete' },

  // 产品管理
  PRODUCT_CREATE: { resource: 'products', action: 'create' },
  PRODUCT_READ: { resource: 'products', action: 'read' },
  PRODUCT_UPDATE: { resource: 'products', action: 'update' },
  PRODUCT_DELETE: { resource: 'products', action: 'delete' },
};

// 所有权限
export const ALL_PERMISSIONS = {
  ...SYSTEM_PERMISSIONS,
  ...BUSINESS_PERMISSIONS,
};
