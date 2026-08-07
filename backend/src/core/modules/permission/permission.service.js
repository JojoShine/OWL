const { Op } = require('sequelize');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const { clearCache } = require('../../../config/rbac');
const { validateSortField, validateOrder } = require('../../../utils/query-validator');

class PermissionService {
  /**
   * 获取权限列表（分页）
   */
  async getPermissions(query) {
    const {
      page = 1,
      limit = 10,
      search,
      resource,
      action,
      category,
      sort = 'category',
      order = 'ASC',
    } = query;

    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (resource) {
      where.resource = resource;
    }

    if (action) {
      where.action = action;
    }

    if (category) {
      where.category = category;
    }

    const safeSort = validateSortField(sort, ['name', 'code', 'resource', 'action', 'category'], 'category');
    const safeOrder = validateOrder(order);

    const { count, rows } = await db.Permission.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[safeSort, safeOrder]],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 获取单个权限详情
   */
  async getPermissionById(id) {
    const permission = await db.Permission.findByPk(id, {
      include: [
        {
          model: db.Role,
          as: 'roles',
          through: { attributes: [] },
        },
      ],
    });

    if (!permission) {
      throw ApiError.notFound('权限不存在');
    }

    return permission;
  }

  /**
   * 创建权限
   */
  async createPermission(permissionData) {
    const { name, code, resource, action, description, category } = permissionData;

    // 检查权限代码是否已存在
    const existingCode = await db.Permission.findOne({ where: { code } });
    if (existingCode) {
      throw ApiError.badRequest('权限代码已存在');
    }

    // 创建权限
    const permission = await db.Permission.create({
      name,
      code,
      resource,
      action,
      description,
      category,
    });

    // 清除RBAC缓存
    clearCache();
    logger.info(`Permission created: ${name}`);

    return permission;
  }

  /**
   * 更新权限
   */
  async updatePermission(id, updateData) {
    const permission = await db.Permission.findByPk(id);

    if (!permission) {
      throw ApiError.notFound('权限不存在');
    }

    const { name, code, resource, action, description, category } = updateData;

    // 检查代码是否被其他权限占用
    if (code && code !== permission.code) {
      const existingCode = await db.Permission.findOne({ where: { code } });
      if (existingCode) {
        throw ApiError.badRequest('权限代码已存在');
      }
    }

    // 更新权限
    await permission.update({
      name,
      code,
      resource,
      action,
      description,
      category,
    });

    // 清除RBAC缓存
    clearCache();
    logger.info(`Permission updated: ${permission.name}`);

    return permission;
  }

  /**
   * 删除权限
   */
  async deletePermission(id) {
    const permission = await db.Permission.findByPk(id);

    if (!permission) {
      throw ApiError.notFound('权限不存在');
    }

    // 检查是否有角色使用此权限
    const roleCount = await db.RolePermission.count({ where: { permission_id: id } });
    if (roleCount > 0) {
      throw ApiError.badRequest(`该权限被 ${roleCount} 个角色使用，无法删除`);
    }

    // 删除权限
    await permission.destroy();

    // 清除RBAC缓存
    clearCache();
    logger.info(`Permission deleted: ${permission.name}`);

    return { message: '权限删除成功' };
  }

  /**
   * 获取所有权限（不分页，按分类分组）
   */
  async getAllPermissions() {
    const permissions = await db.Permission.findAll({
      attributes: ['id', 'name', 'code', 'resource', 'action', 'category', 'description'],
      order: [['category', 'ASC'], ['resource', 'ASC'], ['action', 'ASC']],
    });

    // 按分类分组
    const grouped = permissions.reduce((acc, perm) => {
      const category = perm.category || '其他';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    }, {});

    return grouped;
  }

  /**
   * 获取所有资源列表
   */
  async getResources() {
    const resources = await db.Permission.findAll({
      attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('resource')), 'resource']],
      order: [['resource', 'ASC']],
    });

    return resources.map(r => r.resource);
  }

  /**
   * 获取所有操作类型列表
   */
  async getActions() {
    const actions = await db.Permission.findAll({
      attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('action')), 'action']],
      order: [['action', 'ASC']],
    });

    return actions.map(a => a.action);
  }

  /**
   * 获取所有分类列表
   */
  async getCategories() {
    const categories = await db.Permission.findAll({
      attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('category')), 'category']],
      where: {
        category: { [Op.ne]: null },
      },
      order: [['category', 'ASC']],
    });

    return categories.map(c => c.category);
  }
}

module.exports = new PermissionService();
