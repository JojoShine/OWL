const { Op } = require('sequelize');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const { clearCache } = require('../../../config/rbac');
const { validateSortField, validateOrder } = require('../../../utils/query-validator');

class RoleService {
  /**
   * 获取角色列表（分页）
   */
  async getRoles(query) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sort = 'sort',
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

    if (status) {
      where.status = status;
    }

    const safeSort = validateSortField(sort, ['name', 'code', 'sort', 'status'], 'sort');
    const safeOrder = validateOrder(order);

    const { count, rows } = await db.Role.findAndCountAll({
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
   * 获取单个角色详情
   */
  async getRoleById(id) {
    // 并行查询角色基本信息、权限和菜单
    const [role, permissions, menus] = await Promise.all([
      db.Role.findByPk(id),
      db.Permission.findAll({
        include: [{
          model: db.Role,
          as: 'roles',
          where: { id },
          attributes: [],
          through: { attributes: [] },
        }],
        attributes: ['id', 'name', 'code', 'category'],
      }),
      db.Menu.findAll({
        include: [{
          model: db.Role,
          as: 'roles',
          where: { id },
          attributes: [],
          through: { attributes: [] },
        }],
        attributes: ['id', 'name', 'path', 'icon'],
      }),
    ]);

    if (!role) {
      throw ApiError.notFound('角色不存在');
    }

    // 组装返回数据
    const result = role.toJSON();
    result.permissions = permissions;
    result.menus = menus;

    return result;
  }

  /**
   * 创建角色
   */
  async createRole(roleData) {
    const { name, code, description, status, sort, permission_ids, menu_ids } = roleData;

    // 检查角色名称是否已存在
    const existingName = await db.Role.findOne({ where: { name } });
    if (existingName) {
      throw ApiError.badRequest('角色名称已存在');
    }

    // 检查角色代码是否已存在
    const existingCode = await db.Role.findOne({ where: { code } });
    if (existingCode) {
      throw ApiError.badRequest('角色代码已存在');
    }

    // 创建角色
    const role = await db.Role.create({
      name,
      code,
      description,
      status,
      sort,
    });

    // 分配权限
    if (permission_ids && permission_ids.length > 0) {
      const permissions = await db.Permission.findAll({
        where: { id: { [Op.in]: permission_ids } },
      });

      if (permissions.length !== permission_ids.length) {
        throw ApiError.badRequest('部分权限不存在');
      }

      await Promise.all(
        permission_ids.map(permission_id =>
          db.RolePermission.create({ role_id: role.id, permission_id })
        )
      );
    }

    // 分配菜单
    if (menu_ids && menu_ids.length > 0) {
      const menus = await db.Menu.findAll({
        where: { id: { [Op.in]: menu_ids } },
      });

      if (menus.length !== menu_ids.length) {
        throw ApiError.badRequest('部分菜单不存在');
      }

      await Promise.all(
        menu_ids.map(menu_id =>
          db.RoleMenu.create({ role_id: role.id, menu_id })
        )
      );
    }

    // 清除RBAC缓存
    clearCache();
    logger.info(`Role created: ${name}`);

    return this.getRoleById(role.id);
  }

  /**
   * 更新角色
   */
  async updateRole(id, updateData) {
    const role = await db.Role.findByPk(id);

    if (!role) {
      throw ApiError.notFound('角色不存在');
    }

    const { name, code, description, status, sort, permission_ids, menu_ids } = updateData;

    // 检查名称是否被其他角色占用
    if (name && name !== role.name) {
      const existingName = await db.Role.findOne({ where: { name } });
      if (existingName) {
        throw ApiError.badRequest('角色名称已存在');
      }
    }

    // 检查代码是否被其他角色占用
    if (code && code !== role.code) {
      const existingCode = await db.Role.findOne({ where: { code } });
      if (existingCode) {
        throw ApiError.badRequest('角色代码已存在');
      }
    }

    // 更新角色基本信息
    await role.update({
      name,
      code,
      description,
      status,
      sort,
    });

    // 更新权限
    if (permission_ids !== undefined) {
      await db.RolePermission.destroy({ where: { role_id: id } });

      if (permission_ids.length > 0) {
        const permissions = await db.Permission.findAll({
          where: { id: { [Op.in]: permission_ids } },
        });

        if (permissions.length !== permission_ids.length) {
          throw ApiError.badRequest('部分权限不存在');
        }

        await Promise.all(
          permission_ids.map(permission_id =>
            db.RolePermission.create({ role_id: id, permission_id })
          )
        );
      }
    }

    // 更新菜单
    if (menu_ids !== undefined) {
      await db.RoleMenu.destroy({ where: { role_id: id } });

      if (menu_ids.length > 0) {
        const menus = await db.Menu.findAll({
          where: { id: { [Op.in]: menu_ids } },
        });

        if (menus.length !== menu_ids.length) {
          throw ApiError.badRequest('部分菜单不存在');
        }

        await Promise.all(
          menu_ids.map(menu_id =>
            db.RoleMenu.create({ role_id: id, menu_id })
          )
        );
      }
    }

    // 清除RBAC缓存
    clearCache();
    logger.info(`Role updated: ${role.name}`);

    return this.getRoleById(id);
  }

  /**
   * 删除角色（软删除）
   */
  async deleteRole(id) {
    const role = await db.Role.findByPk(id);

    if (!role) {
      throw ApiError.notFound('角色不存在');
    }

    // 检查是否有用户使用此角色
    const userCount = await db.UserRole.count({ where: { role_id: id } });
    if (userCount > 0) {
      throw ApiError.badRequest(`该角色被 ${userCount} 个用户使用，无法删除`);
    }

    // 删除角色关联
    await db.RolePermission.destroy({ where: { role_id: id } });
    await db.RoleMenu.destroy({ where: { role_id: id } });

    // 软删除角色
    await role.destroy();

    // 清除RBAC缓存
    clearCache();
    logger.info(`Role deleted: ${role.name}`);

    return { message: '角色删除成功' };
  }

  /**
   * 获取所有角色（不分页，用于下拉选择）
   */
  async getAllRoles() {
    const roles = await db.Role.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'code', 'description'],
      order: [['sort', 'ASC']],
    });

    return roles;
  }
}

module.exports = new RoleService();
