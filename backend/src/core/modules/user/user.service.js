const { Op } = require('sequelize');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const { validateSortField, validateOrder } = require('../../../utils/query-validator');
const { invalidateAuthenticatedUser } = require('../../../middlewares/auth');

class UserService {
  /**
   * 获取用户列表（分页）
   */
  async getUsers(query) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      role_id,
      sort = 'created_at',
      order = 'DESC',
    } = query;

    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { real_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // 构建include条件
    const include = [
      {
        model: db.Role,
        as: 'roles',
        through: { attributes: [] },
      },
    ];

    // 如果按角色筛选
    if (role_id) {
      include[0].where = { id: role_id };
      include[0].required = true;
    }

    const safeSort = validateSortField(sort, ['username', 'email', 'status', 'department_id', 'access_level']);
    const safeOrder = validateOrder(order);

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'deleted_at'] },
      include,
      limit: parseInt(limit),
      offset,
      order: [[safeSort, safeOrder]],
      distinct: true, // 多对多关系需要distinct避免重复计数
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
   * 获取单个用户详情
   */
  async getUserById(id) {
    const user = await db.User.findByPk(id, {
      attributes: { exclude: ['password', 'deleted_at'] },
      include: [
        {
          model: db.Role,
          as: 'roles',
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      throw ApiError.notFound('用户不存在');
    }

    return user;
  }

  /**
   * 创建用户
   */
  async createUser(userData) {
    const { username, email, password, real_name, phone, status, access_level, role_ids } = userData;

    // 检查用户名是否已存在
    const existingUser = await db.User.findOne({ where: { username } });
    if (existingUser) {
      throw ApiError.badRequest('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await db.User.findOne({ where: { email } });
    if (existingEmail) {
      throw ApiError.badRequest('邮箱已被注册');
    }

    // 如果提供了手机号，检查是否已存在
    if (phone) {
      const existingPhone = await db.User.findOne({ where: { phone } });
      if (existingPhone) {
        throw ApiError.badRequest('手机号已被注册');
      }
    }

    // 创建用户
    const user = await db.User.create({
      username,
      email,
      password,
      real_name,
      phone,
      status,
      access_level,
    });

    // 分配角色
    if (role_ids && role_ids.length > 0) {
      const roles = await db.Role.findAll({
        where: { id: { [Op.in]: role_ids } },
      });

      if (roles.length !== role_ids.length) {
        throw ApiError.badRequest('部分角色不存在');
      }

      await Promise.all(
        role_ids.map(role_id =>
          db.UserRole.create({ user_id: user.id, role_id })
        )
      );
    }

    logger.info(`User created: ${username} by admin`);

    return this.getUserById(user.id);
  }

  /**
   * 更新用户信息
   */
  async updateUser(id, updateData) {
    const user = await db.User.findByPk(id);

    if (!user) {
      throw ApiError.notFound('用户不存在');
    }

    const { username, email, password, phone, real_name, avatar, status, access_level, department_id, role_ids } = updateData;

    // 检查用户名是否被其他用户占用
    if (username && username !== user.username) {
      const existingUser = await db.User.findOne({ where: { username } });
      if (existingUser) {
        throw ApiError.badRequest('用户名已存在');
      }
    }

    // 检查邮箱是否被其他用户占用
    if (email && email !== user.email) {
      const existingEmail = await db.User.findOne({ where: { email } });
      if (existingEmail) {
        throw ApiError.badRequest('邮箱已被注册');
      }
    }

    // 检查手机号是否被其他用户占用
    if (phone && phone !== user.phone) {
      const existingPhone = await db.User.findOne({ where: { phone } });
      if (existingPhone) {
        throw ApiError.badRequest('手机号已被注册');
      }
    }

    // 构建更新数据对象
    const updateFields = {
      username,
      email,
      phone,
      real_name,
      avatar,
      status,
      access_level,
      department_id,
    };

    // 只有提供了密码才更新密码
    if (password) {
      updateFields.password = password;
    }

    // 更新用户基本信息
    await user.update(updateFields);

    // 更新角色
    if (role_ids !== undefined) {
      // 删除旧的角色关联
      await db.UserRole.destroy({ where: { user_id: id } });

      // 创建新的角色关联
      if (role_ids.length > 0) {
        const roles = await db.Role.findAll({
          where: { id: { [Op.in]: role_ids } },
        });

        if (roles.length !== role_ids.length) {
          throw ApiError.badRequest('部分角色不存在');
        }

        await Promise.all(
          role_ids.map(role_id =>
            db.UserRole.create({ user_id: id, role_id })
          )
        );
      }
    }

    invalidateAuthenticatedUser(id);
    logger.info(`User updated: ${user.username}`);

    return this.getUserById(id);
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUser(id) {
    const user = await db.User.findByPk(id);

    if (!user) {
      throw ApiError.notFound('用户不存在');
    }

    // 软删除
    await user.destroy();

    invalidateAuthenticatedUser(id);
    logger.info(`User deleted: ${user.username}`);

    return { message: '用户删除成功' };
  }

  /**
   * 重置用户密码
   */
  async resetPassword(id, newPassword) {
    const user = await db.User.findByPk(id);

    if (!user) {
      throw ApiError.notFound('用户不存在');
    }

    await user.update({ password: newPassword });

    invalidateAuthenticatedUser(id);
    logger.info(`User password reset: ${user.username}`);

    return { message: '密码重置成功' };
  }
}

module.exports = new UserService();
