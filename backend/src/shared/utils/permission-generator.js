/**
 * 权限自动生成工具
 * 根据菜单信息自动生成对应的 CRUD 权限
 */

const { logger } = require('../config/logger');

/**
 * 操作类型中文名称映射
 */
const ACTION_NAMES = {
  create: '创建',
  read: '查看',
  update: '更新',
  delete: '删除',
};

/**
 * 根据菜单信息自动生成完整的 CRUD 权限
 * @param {Object} menu - 菜单对象
 * @returns {Array|null} 权限数组（包含4个CRUD权限），如果不需要生成权限则返回 null
 */
function generatePermissionsFromMenu(menu) {
  // 如果没有 path，说明是父级菜单，不生成权限
  if (!menu.path || menu.path.trim() === '') {
    logger.debug(`Menu "${menu.name}" has no path, skipping permission generation`);
    return null;
  }

  // 从菜单路径提取资源名称
  const resource = extractResourceFromPath(menu.path);
  const category = menu.menu_type === 'system' ? '系统管理' : '业务管理';

  // 生成4个 CRUD 权限
  const permissions = [
    {
      name: `${menu.name}-创建`,
      code: `${resource}:create`,
      resource: resource,
      action: 'create',
      category: category,
      description: `${menu.name}的创建权限（自动生成）`,
    },
    {
      name: `${menu.name}-查看`,
      code: `${resource}:read`,
      resource: resource,
      action: 'read',
      category: category,
      description: `${menu.name}的查看权限（自动生成）`,
    },
    {
      name: `${menu.name}-更新`,
      code: `${resource}:update`,
      resource: resource,
      action: 'update',
      category: category,
      description: `${menu.name}的更新权限（自动生成）`,
    },
    {
      name: `${menu.name}-删除`,
      code: `${resource}:delete`,
      resource: resource,
      action: 'delete',
      category: category,
      description: `${menu.name}的删除权限（自动生成）`,
    },
  ];

  return permissions;
}

/**
 * 获取菜单应该关联的权限代码（默认为 read）
 * @param {Object} menu - 菜单对象
 * @returns {String|null} 权限代码
 */
function getMenuPermissionCode(menu) {
  // 如果已指定 permission_code，使用指定的
  if (menu.permission_code) {
    return menu.permission_code;
  }

  // 如果没有 path，不关联权限
  if (!menu.path || menu.path.trim() === '') {
    return null;
  }

  // 默认关联 read 权限
  const resource = extractResourceFromPath(menu.path);
  return `${resource}:read`;
}

/**
 * 从路径提取资源名称
 * @param {String} path - 菜单路径
 * @returns {String} 资源名称
 */
function extractResourceFromPath(path) {
  if (!path) {
    return 'unknown';
  }

  // 移除开头的斜杠并分割路径
  const parts = path.replace(/^\//, '').split('/').filter(p => p);

  if (parts.length === 0) {
    return 'unknown';
  }

  // 获取最后一个有意义的部分
  let resource = parts[parts.length - 1];

  // 移除常见的后缀
  resource = resource
    .replace(/-(list|detail|edit|create|add)$/, '')
    .replace(/\/(list|detail|edit|create|add)$/, '');

  return resource;
}

/**
 * 预览将要生成的权限（不实际创建）
 * @param {Object} menu - 菜单对象
 * @returns {Object} 权限预览信息
 */
function previewPermissions(menu) {
  try {
    const permissions = generatePermissionsFromMenu(menu);

    if (!permissions) {
      return {
        success: true,
        permissions: [],
        menuPermissionCode: null,
        message: '该菜单无需生成权限（父级菜单）',
      };
    }

    const menuPermissionCode = getMenuPermissionCode(menu);

    return {
      success: true,
      permissions: permissions,
      menuPermissionCode: menuPermissionCode,
      message: `将生成 ${permissions.length} 个权限，菜单关联权限: ${menuPermissionCode}`,
    };
  } catch (error) {
    return {
      success: false,
      permissions: [],
      menuPermissionCode: null,
      message: `权限预览失败: ${error.message}`,
    };
  }
}

module.exports = {
  generatePermissionsFromMenu,
  getMenuPermissionCode,
  extractResourceFromPath,
  previewPermissions,
};