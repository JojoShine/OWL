const { Op } = require('sequelize');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const { validateSortField, validateOrder } = require('../../../utils/query-validator');

class DepartmentService {
  /**
   * 获取部门列表（分页）
   */
  async getDepartments(query) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      parent_id,
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
      ];
    }

    if (status) {
      where.status = status;
    }

    if (parent_id !== undefined) {
      where.parent_id = parent_id === 'null' ? null : parent_id;
    }

    const safeSort = validateSortField(sort, ['name', 'code', 'sort', 'status'], 'sort');
    const safeOrder = validateOrder(order);

    const { count, rows } = await db.Department.findAndCountAll({
      where,
      include: [
        {
          model: db.Department,
          as: 'parent',
          attributes: ['id', 'name'],
        },
        {
          model: db.User,
          as: 'leader',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
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
   * 获取部门树（递归构建）
   */
  async getDepartmentTree() {
    const departments = await db.Department.findAll({
      where: { status: 'active' },
      include: [
        {
          model: db.User,
          as: 'leader',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
      order: [['sort', 'ASC']],
    });

    // 构建树形结构
    const buildTree = (parentId = null) => {
      return departments
        .filter(dept => dept.parent_id === parentId)
        .map(dept => ({
          ...dept.toJSON(),
          children: buildTree(dept.id),
        }));
    };

    return buildTree();
  }

  /**
   * 获取单个部门详情
   */
  async getDepartmentById(id) {
    const department = await db.Department.findByPk(id, {
      include: [
        {
          model: db.Department,
          as: 'parent',
          attributes: ['id', 'name'],
        },
        {
          model: db.Department,
          as: 'children',
        },
        {
          model: db.User,
          as: 'leader',
          attributes: ['id', 'username', 'real_name', 'email', 'phone'],
        },
      ],
    });

    if (!department) {
      throw ApiError.notFound('部门不存在');
    }

    return department;
  }

  /**
   * 创建部门
   */
  async createDepartment(departmentData) {
    const {
      parent_id,
      name,
      code,
      leader_id,
      description,
      sort,
      status,
    } = departmentData;

    // 如果有父部门，检查父部门是否存在
    if (parent_id) {
      const parentDept = await db.Department.findByPk(parent_id);
      if (!parentDept) {
        throw ApiError.notFound('父部门不存在');
      }
    }

    // 检查部门代码是否重复
    if (code) {
      const existingDept = await db.Department.findOne({ where: { code } });
      if (existingDept) {
        throw ApiError.badRequest('部门代码已存在');
      }
    }

    // 如果有负责人，检查负责人是否存在
    if (leader_id) {
      const leader = await db.User.findByPk(leader_id);
      if (!leader) {
        throw ApiError.notFound('负责人不存在');
      }
    }

    // 创建部门
    const department = await db.Department.create({
      parent_id,
      name,
      code,
      leader_id,
      description,
      sort,
      status,
    });

    logger.info(`Department created: ${name}`);

    return this.getDepartmentById(department.id);
  }

  /**
   * 更新部门
   */
  async updateDepartment(id, updateData) {
    const department = await db.Department.findByPk(id);

    if (!department) {
      throw ApiError.notFound('部门不存在');
    }

    const {
      parent_id,
      name,
      code,
      leader_id,
      description,
      sort,
      status,
    } = updateData;

    // 不能将部门的父级设置为自己或自己的子级
    if (parent_id && parent_id !== department.parent_id) {
      if (parent_id === id) {
        throw ApiError.badRequest('不能将部门的父级设置为自己');
      }

      // 检查是否会形成循环引用
      const isDescendant = await this.isDescendant(id, parent_id);
      if (isDescendant) {
        throw ApiError.badRequest('不能将部门的父级设置为自己的子级');
      }

      // 检查父部门是否存在
      const parentDept = await db.Department.findByPk(parent_id);
      if (!parentDept) {
        throw ApiError.notFound('父部门不存在');
      }
    }

    // 检查部门代码是否重复
    if (code && code !== department.code) {
      const existingDept = await db.Department.findOne({ where: { code } });
      if (existingDept) {
        throw ApiError.badRequest('部门代码已存在');
      }
    }

    // 如果有负责人，检查负责人是否存在
    if (leader_id && leader_id !== department.leader_id) {
      const leader = await db.User.findByPk(leader_id);
      if (!leader) {
        throw ApiError.notFound('负责人不存在');
      }
    }

    // 更新部门
    await department.update({
      parent_id,
      name,
      code,
      leader_id,
      description,
      sort,
      status,
    });

    logger.info(`Department updated: ${department.name}`);

    return this.getDepartmentById(id);
  }

  /**
   * 删除部门
   */
  async deleteDepartment(id) {
    const department = await db.Department.findByPk(id);

    if (!department) {
      throw ApiError.notFound('部门不存在');
    }

    // 检查是否有子部门（排除已软删除的）
    const childCount = await db.Department.count({
      where: {
        parent_id: id,
        deleted_at: null
      }
    });
    if (childCount > 0) {
      throw ApiError.badRequest(`该部门有 ${childCount} 个子部门，请先删除子部门`);
    }

    // 检查是否有部门成员
    const memberCount = await db.User.count({ where: { department_id: id } });
    if (memberCount > 0) {
      throw ApiError.badRequest(`该部门有 ${memberCount} 名成员，请先转移成员`);
    }

    // 删除部门
    await department.destroy();

    logger.info(`Department deleted: ${department.name}`);

    return { message: '部门删除成功' };
  }

  /**
   * 获取部门成员列表
   */
  async getDepartmentMembers(departmentId, query = {}) {
    const department = await db.Department.findByPk(departmentId);

    if (!department) {
      throw ApiError.notFound('部门不存在');
    }

    const {
      page = 1,
      limit = 10,
      search,
      status,
    } = query;

    const offset = (page - 1) * limit;

    const where = { department_id: departmentId };

    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { real_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'real_name', 'email', 'phone', 'status', 'created_at'],
      include: [
        {
          model: db.Role,
          as: 'roles',
          through: { attributes: [] },
          attributes: ['id', 'name', 'code'],
        },
      ],
      pageSize: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      department,
      members: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 检查是否是后代节点（防止循环引用）
   */
  async isDescendant(ancestorId, descendantId) {
    const descendant = await db.Department.findByPk(descendantId);
    if (!descendant || !descendant.parent_id) {
      return false;
    }

    if (descendant.parent_id === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, descendant.parent_id);
  }
}

module.exports = new DepartmentService();