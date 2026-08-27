const { Op } = require('sequelize');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger, operationLogger } = require('../../../config/logger');
const { validateSortField, validateOrder } = require('../../../utils/query-validator');
const dataMaskingMiddleware = require('../../../middlewares/dataMasking');

class DataSecurityService {
  /**
   * 获取敏感字段列表
   */
  async getSensitiveFields(query) {
    const {
      page = 1,
      limit = 20,
      table_name,
      is_active,
      sort = 'created_at',
      order = 'DESC',
    } = query;

    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};

    if (table_name) {
      where.table_name = table_name;
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const safeSort = validateSortField(sort, ['field_name', 'table_name', 'mask_type', 'is_active']);
    const safeOrder = validateOrder(order);

    const { count, rows } = await db.SensitiveField.findAndCountAll({
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
   * 获取单个敏感字段详情
   */
  async getSensitiveFieldById(id) {
    const field = await db.SensitiveField.findByPk(id);
    
    if (!field) {
      throw ApiError.notFound('敏感字段配置不存在');
    }

    return field;
  }

  /**
   * 创建敏感字段配置
   */
  async createSensitiveField(data) {
    // 检查是否已存在
    const existing = await db.SensitiveField.findOne({
      where: {
        table_name: data.table_name,
        field_name: data.field_name,
      },
    });

    if (existing) {
      throw ApiError.badRequest('该表的该字段已配置为敏感字段');
    }

    const field = await db.SensitiveField.create({
      table_name: data.table_name,
      field_name: data.field_name,
      mask_type: data.mask_type || 'custom',
      mask_rule: data.mask_rule,
      description: data.description,
      is_active: data.is_active !== false,
    });
    dataMaskingMiddleware.invalidateSensitiveFields();

    logger.info(`创建敏感字段配置: ${data.table_name}.${data.field_name}`);

    return field;
  }

  /**
   * 更新敏感字段配置
   */
  async updateSensitiveField(id, data) {
    const field = await db.SensitiveField.findByPk(id);
    
    if (!field) {
      throw ApiError.notFound('敏感字段配置不存在');
    }

    const oldTableName = field.table_name;

    await field.update({
      mask_type: data.mask_type,
      mask_rule: data.mask_rule,
      description: data.description,
      is_active: data.is_active,
    });

    // 如果表名变更，需要更新表名
    if (data.table_name && data.table_name !== oldTableName) {
      await field.update({ table_name: data.table_name });
    }
    dataMaskingMiddleware.invalidateSensitiveFields();

    logger.info(`更新敏感字段配置: ${field.id}`);

    return field;
  }

  /**
   * 删除敏感字段配置
   */
  async deleteSensitiveField(id) {
    const field = await db.SensitiveField.findByPk(id);
    
    if (!field) {
      throw ApiError.notFound('敏感字段配置不存在');
    }

    await field.destroy();
    dataMaskingMiddleware.invalidateSensitiveFields();

    logger.info(`删除敏感字段配置: ${id}`);

    return true;
  }

  /**
   * 批量导入敏感字段配置
   */
  async batchImportSensitiveFields(fields) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const field of fields) {
      try {
        await this.createSensitiveField(field);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          field: `${field.table_name}.${field.field_name}`,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 验证用户密码并记录尝试次数
   */
  async validatePasswordWithAttempts(userId, password, reqInfo) {
    // 获取用户信息
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('用户不存在');
    }

    // 验证密码
    const isValid = await user.validatePassword(password);

    if (!isValid) {
      // 记录审计日志
      logger.info(JSON.stringify({
        type: 'sensitive_data_access',
        action: 'password_verify_failed',
        user_id: userId,
        username: user.username,
        ip_address: reqInfo.ipAddress,
        user_agent: reqInfo.userAgent,
        timestamp: new Date().toISOString(),
      }));

      throw ApiError.unauthorized('密码错误');
    }

    return user;
  }

  /**
   * 检查用户是否有明文查看权限
   * 注意：当前实现仅支持自动脱敏，不支持明文查看
   * 此方法预留用于未来扩展
   */
  async checkPlainAccessPermission(userId, tableName, fieldName) {
    // TODO: 如果未来需要支持明文查看，可以在此实现
    // 目前返回 false，表示不支持明文查看
    return {
      hasPermission: false,
      message: '当前系统仅支持自动脱敏，不支持明文查看',
    };
  }

  /**
   * 获取敏感字段统计信息
   */
  async getStatistics() {
    const totalCount = await db.SensitiveField.count();
    const activeCount = await db.SensitiveField.count({
      where: { is_active: true },
    });
    const inactiveCount = await db.SensitiveField.count({
      where: { is_active: false },
    });

    // 按表分组统计
    const tableStats = await db.SensitiveField.findAll({
      attributes: [
        'table_name',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      group: ['table_name'],
      order: [['count', 'DESC']],
    });

    return {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      byTable: tableStats.map(stat => ({
        tableName: stat.table_name,
        count: parseInt(stat.getDataValue('count')),
      })),
    };
  }
}

module.exports = new DataSecurityService();
