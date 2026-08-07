const { Op } = require('sequelize');
const db = require('../../../models');
const { logger } = require('../../../config/logger');
const { validateSortField, validateOrder } = require('../../../utils/query-validator');

class GenerationHistoryService {
  /**
   * 记录生成历史
   * @param {Object} data - 生成历史数据
   */
  async recordHistory(data) {
    const {
      module_id,
      table_name,
      module_name,
      operation_type,
      files_generated,
      success,
      error_message,
      user_id,
    } = data;

    try {
      const history = await db.GenerationHistory.create({
        module_id,
        table_name,
        module_name,
        operation_type,
        files_generated,
        success,
        error_message,
        generated_by: user_id,
      });

      logger.info(`Generation history recorded: ${history.id}`, {
        moduleId: module_id,
        operationType: operation_type,
        success,
      });

      return history;
    } catch (error) {
      logger.error('Failed to record generation history:', error);
      throw error;
    }
  }

  /**
   * 获取生成历史列表（分页）
   */
  async getHistoryList(query) {
    const {
      page = 1,
      limit = 10,
      module_id,
      operation_type,
      success,
      sort = 'created_at',
      order = 'DESC',
    } = query;

    const offset = (page - 1) * limit;
    const where = {};

    if (module_id) {
      where.module_id = module_id;
    }

    if (operation_type) {
      where.operation_type = operation_type;
    }

    if (success !== undefined) {
      where.success = success === 'true' || success === true;
    }

    const safeSort = validateSortField(sort, ['module_name', 'table_name', 'operation_type', 'success']);
    const safeOrder = validateOrder(order);

    const { count, rows } = await db.GenerationHistory.findAndCountAll({
      where,
      include: [
        {
          model: db.GeneratedModule,
          as: 'module',
          attributes: ['id', 'module_name', 'table_name', 'description'],
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
   * 获取单个历史记录详情
   */
  async getHistoryById(id) {
    const history = await db.GenerationHistory.findByPk(id, {
      include: [
        {
          model: db.GeneratedModule,
          as: 'module',
        },
      ],
    });

    return history;
  }

  /**
   * 获取模块的生成历史（分页）
   */
  async getModuleHistory(moduleId, options = {}) {
    const {
      page = 1,
      limit = 10,
      operation_type,
      success,
      sort = 'created_at',
      order = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const where = { module_id: moduleId };

    // 可选过滤条件
    if (operation_type) {
      where.operation_type = operation_type;
    }

    if (success !== undefined) {
      where.success = success === 'true' || success === true;
    }

    const safeSort = validateSortField(sort, ['module_name', 'table_name', 'operation_type', 'success']);
    const safeOrder = validateOrder(order);

    const { count, rows } = await db.GenerationHistory.findAndCountAll({
      where,
      include: [
        {
          model: db.GeneratedModule,
          as: 'module',
          attributes: ['id', 'module_name', 'table_name', 'description'],
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
   * 获取生成统计信息
   */
  async getStatistics(options = {}) {
    const { start_date, end_date } = options;
    const where = {};

    if (start_date) {
      where.created_at = { [Op.gte]: new Date(start_date) };
    }

    if (end_date) {
      where.created_at = {
        ...where.created_at,
        [Op.lte]: new Date(end_date),
      };
    }

    // 总生成次数
    const totalCount = await db.GenerationHistory.count({ where });

    // 成功次数
    const successCount = await db.GenerationHistory.count({
      where: { ...where, success: true },
    });

    // 失败次数
    const failureCount = await db.GenerationHistory.count({
      where: { ...where, success: false },
    });

    // 按操作类型统计
    const byOperationType = await db.GenerationHistory.findAll({
      where,
      attributes: [
        'operation_type',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      group: ['operation_type'],
    });

    // 最近生成的模块
    const recentGenerations = await db.GenerationHistory.findAll({
      where,
      include: [
        {
          model: db.GeneratedModule,
          as: 'module',
          attributes: ['id', 'module_name', 'table_name'],
        },
      ],
      limit: 10,
      order: [['created_at', 'DESC']],
    });

    return {
      total: totalCount,
      success: successCount,
      failure: failureCount,
      successRate: totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(2) : 0,
      byOperationType: byOperationType.map((item) => ({
        type: item.operation_type,
        count: parseInt(item.get('count')),
      })),
      recentGenerations,
    };
  }

  /**
   * 清理旧的历史记录
   * @param {Number} daysToKeep - 保留最近多少天的记录
   */
  async cleanupOldHistory(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deletedCount = await db.GenerationHistory.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${deletedCount} old generation history records`);

    return {
      message: `已清理 ${deletedCount} 条历史记录`,
      deletedCount,
    };
  }

  /**
   * 删除模块的所有历史记录
   */
  async deleteModuleHistory(moduleId) {
    const deletedCount = await db.GenerationHistory.destroy({
      where: { module_id: moduleId },
    });

    logger.info(`Deleted ${deletedCount} history records for module ${moduleId}`);

    return {
      message: `已删除 ${deletedCount} 条历史记录`,
      deletedCount,
    };
  }
}

module.exports = new GenerationHistoryService();
