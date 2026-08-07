const { Op } = require('sequelize');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const filePermissionService = require('../file/file-permission.service');
const { validateSortField, validateOrder } = require('../../../utils/query-validator');

class FolderService {
  /**
   * 获取文件夹列表（分页）
   */
  async getFolders(query, userId) {
    const {
      page = 1,
      limit = 20,
      search,
      parent_id,
      sort = 'created_at',
      order = 'DESC',
    } = query;

    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {
      created_by: userId, // 只能查看自己创建的文件夹
    };

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    if (parent_id !== undefined) {
      where.parent_id = parent_id === 'null' ? null : parent_id;
    }

    const safeSort = validateSortField(sort, ['name']);
    const safeOrder = validateOrder(order);

    const { count, rows } = await db.Folder.findAndCountAll({
      where,
      include: [
        {
          model: db.Folder,
          as: 'parent',
          attributes: ['id', 'name'],
        },
        {
          model: db.User,
          as: 'creator',
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
   * 获取文件夹树（递归构建）
   */
  async getFolderTree(userId) {
    const folders = await db.Folder.findAll({
      where: { created_by: userId },
      order: [['name', 'ASC']],
    });

    // 构建树形结构
    const buildTree = (parentId = null) => {
      return folders
        .filter(folder => folder.parent_id === parentId)
        .map(folder => ({
          ...folder.toJSON(),
          children: buildTree(folder.id),
        }));
    };

    return buildTree();
  }

  /**
   * 获取单个文件夹详情
   */
  async getFolderById(id, userId) {
    const folder = await db.Folder.findOne({
      where: {
        id,
        created_by: userId, // 只能查看自己的文件夹
      },
      include: [
        {
          model: db.Folder,
          as: 'parent',
          attributes: ['id', 'name'],
        },
        {
          model: db.Folder,
          as: 'children',
        },
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
    });

    if (!folder) {
      throw ApiError.notFound('文件夹不存在');
    }

    return folder;
  }

  /**
   * 获取文件夹内容（子文件夹 + 文件）
   */
  async getFolderContents(id, userId, query = {}) {
    // 如果 id 为 null 或 'root'，获取根目录内容
    const folderId = id === 'root' || id === 'null' ? null : id;

    // 如果不是根目录，验证文件夹是否存在
    if (folderId) {
      const folder = await db.Folder.findOne({
        where: {
          id: folderId,
          created_by: userId,
        },
      });

      if (!folder) {
        throw ApiError.notFound('文件夹不存在');
      }
    }

    const { search, sort = 'created_at', order = 'DESC' } = query;
    const safeSort = validateSortField(sort, ['name', 'original_name']);
    const safeOrder = validateOrder(order);

    // 构建文件夹的查询条件
    const folderWhere = {
      created_by: userId,
      parent_id: folderId,  // 修复：应该使用 parent_id 而不是 folder_id
    };

    if (search) {
      folderWhere.name = { [Op.iLike]: `%${search}%` };
    }

    // 查询子文件夹
    const folders = await db.Folder.findAll({
      where: folderWhere,
      order: [[safeSort, safeOrder]],
    });

    // 查询文件（基于文件的查询条件）
    const fileWhere = {
      uploaded_by: userId,
      folder_id: folderId,
    };

    if (search) {
      fileWhere.original_name = { [Op.iLike]: `%${search}%` };
    }

    const files = await db.File.findAll({
      where: fileWhere,
      order: [[safeSort, safeOrder]],
    });

    return {
      folders,
      files,
      total: folders.length + files.length,
    };
  }

  /**
   * 创建文件夹
   */
  async createFolder(folderData, userId) {
    const { name, parent_id } = folderData;

    // 如果有父文件夹，检查父文件夹是否存在
    if (parent_id) {
      const parentFolder = await db.Folder.findOne({
        where: {
          id: parent_id,
          created_by: userId,
        },
      });

      if (!parentFolder) {
        throw ApiError.notFound('父文件夹不存在');
      }
    }

    // 检查同级是否有同名文件夹
    const existingFolder = await db.Folder.findOne({
      where: {
        name,
        parent_id: parent_id || null,
        created_by: userId,
      },
    });

    if (existingFolder) {
      throw ApiError.badRequest('同级已存在同名文件夹');
    }

    // 创建文件夹
    const folder = await db.Folder.create({
      name,
      parent_id: parent_id || null,
      created_by: userId,
    });

    // 设置默认权限
    await filePermissionService.setDefaultPermissions('folder', folder.id, userId);

    logger.info(`Folder created: ${name} by user ${userId}`);

    return this.getFolderById(folder.id, userId);
  }

  /**
   * 更新文件夹
   */
  async updateFolder(id, updateData, userId) {
    const folder = await db.Folder.findOne({
      where: {
        id,
        created_by: userId, // 只能更新自己的文件夹
      },
    });

    if (!folder) {
      throw ApiError.notFound('文件夹不存在');
    }

    const { name, parent_id } = updateData;

    // 如果更新父文件夹
    if (parent_id !== undefined && parent_id !== folder.parent_id) {
      // 不能将文件夹的父级设置为自己
      if (parent_id === id) {
        throw ApiError.badRequest('不能将文件夹的父级设置为自己');
      }

      // 检查是否会形成循环引用
      if (parent_id) {
        const isDescendant = await this.isDescendant(id, parent_id);
        if (isDescendant) {
          throw ApiError.badRequest('不能将文件夹的父级设置为自己的子级');
        }

        // 检查父文件夹是否存在
        const parentFolder = await db.Folder.findOne({
          where: {
            id: parent_id,
            created_by: userId,
          },
        });

        if (!parentFolder) {
          throw ApiError.notFound('父文件夹不存在');
        }
      }
    }

    // 如果更新名称，检查同级是否有同名文件夹
    if (name && name !== folder.name) {
      const existingFolder = await db.Folder.findOne({
        where: {
          name,
          parent_id: parent_id !== undefined ? parent_id : folder.parent_id,
          created_by: userId,
          id: { [Op.ne]: id }, // 排除自己
        },
      });

      if (existingFolder) {
        throw ApiError.badRequest('同级已存在同名文件夹');
      }
    }

    // 更新文件夹
    await folder.update({
      name: name !== undefined ? name : folder.name,
      parent_id: parent_id !== undefined ? parent_id : folder.parent_id,
    });

    logger.info(`Folder updated: ${folder.name} by user ${userId}`);

    return this.getFolderById(id, userId);
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(id, userId) {
    const folder = await db.Folder.findOne({
      where: {
        id,
        created_by: userId, // 只能删除自己的文件夹
      },
    });

    if (!folder) {
      throw ApiError.notFound('文件夹不存在');
    }

    // 检查是否有子文件夹
    const childFolderCount = await db.Folder.count({
      where: {
        parent_id: id,
        created_by: userId,
      },
    });

    if (childFolderCount > 0) {
      throw ApiError.badRequest(`该文件夹有 ${childFolderCount} 个子文件夹，请先删除子文件夹`);
    }

    // 检查是否有文件
    const fileCount = await db.File.count({
      where: {
        folder_id: id,
        uploaded_by: userId,
      },
    });

    if (fileCount > 0) {
      throw ApiError.badRequest(`该文件夹有 ${fileCount} 个文件，请先删除文件`);
    }

    // 删除文件夹
    await folder.destroy();

    logger.info(`Folder deleted: ${folder.name} by user ${userId}`);

    return { message: '文件夹删除成功' };
  }

  /**
   * 检查是否是后代节点（防止循环引用）
   */
  async isDescendant(ancestorId, descendantId) {
    const descendant = await db.Folder.findByPk(descendantId);
    if (!descendant || !descendant.parent_id) {
      return false;
    }

    if (descendant.parent_id === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, descendant.parent_id);
  }
}

module.exports = new FolderService();
