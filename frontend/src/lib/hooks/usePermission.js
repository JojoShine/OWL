/**
 * 权限检查 Hook
 * 提供权限检查和按钮显示控制的便捷方法
 */

import { useAuth } from '../utils/auth';

/**
 * 使用权限检查
 * @returns {Object} 权限检查对象
 */
export function usePermission() {
  const { user, hasPermission } = useAuth();

  /**
   * 检查是否有权限
   * @param {Object} permission - 权限对象 { resource, action }
   * @returns {boolean}
   */
  const can = (permission) => {
    if (!permission) return false;
    return hasPermission(permission.resource, permission.action);
  };

  /**
   * 检查是否可以创建
   * @param {string} resource - 资源名称
   * @returns {boolean}
   */
  const canCreate = (resource) => {
    return hasPermission(resource, 'create');
  };

  /**
   * 检查是否可以读取
   * @param {string} resource - 资源名称
   * @returns {boolean}
   */
  const canRead = (resource) => {
    return hasPermission(resource, 'read');
  };

  /**
   * 检查是否可以更新/编辑
   * @param {string} resource - 资源名称
   * @returns {boolean}
   */
  const canUpdate = (resource) => {
    return hasPermission(resource, 'update');
  };

  /**
   * 检查是否可以删除
   * @param {string} resource - 资源名称
   * @returns {boolean}
   */
  const canDelete = (resource) => {
    return hasPermission(resource, 'delete');
  };

  return {
    user,
    can,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
  };
}
