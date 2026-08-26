const apiBuilderService = require('./api-builder.service');
const { logger } = require('../../../config/logger');
const { success, created, paginated } = require('../../../utils/response');

class ApiBuilderController {
  /**
   * 创建接口
   */
  async createInterface(req, res, next) {
    try {
      const data = req.body;
      const userId = req.user.id;

      const interface_ = await apiBuilderService.createInterface(data, userId);
      created(res, interface_.get({ plain: true }), '接口创建成功');
    } catch (error) {
      logger.error('Error creating interface:', error);
      next(error);
    }
  }

  /**
   * 获取接口列表
   */
  async getInterfaces(req, res, next) {
    try {
      const result = await apiBuilderService.getInterfaces(req.query);
      paginated(res, result.items, result.pagination, '获取接口列表成功');
    } catch (error) {
      logger.error('Error getting interfaces:', error);
      next(error);
    }
  }

  /**
   * 获取接口详情
   */
  async getInterface(req, res, next) {
    try {
      const { id } = req.params;
      const interface_ = await apiBuilderService.getInterfaceById(id);
      success(res, interface_.get({ plain: true }), '获取接口详情成功');
    } catch (error) {
      logger.error('Error getting interface:', error);
      next(error);
    }
  }

  /**
   * 更新接口
   */
  async updateInterface(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      const interface_ = await apiBuilderService.updateInterface(id, data);
      success(res, interface_.get({ plain: true }), '接口更新成功');
    } catch (error) {
      logger.error('Error updating interface:', error);
      next(error);
    }
  }

  /**
   * 删除接口
   */
  async deleteInterface(req, res, next) {
    try {
      const { id } = req.params;
      const result = await apiBuilderService.deleteInterface(id);
      success(res, result, result.message);
    } catch (error) {
      logger.error('Error deleting interface:', error);
      next(error);
    }
  }

  /**
   * 测试SQL查询
   */
  async testSql(req, res, next) {
    try {
      const { sql_query, parameters } = req.body;

      if (!sql_query) {
        const ApiError = require('../../../utils/ApiError');
        throw ApiError.badRequest('请输入SQL查询语句');
      }

      const result = await apiBuilderService.testSql(sql_query, parameters || {});
      success(res, result, 'SQL查询成功');
    } catch (error) {
      logger.error('Error testing SQL:', error);
      next(error);
    }
  }

  /**
   * 执行SQL查询（实际执行自定义API）
   */
  async executeSql(req, res, next) {
    try {
      const { sql_query, parameters } = req.body;

      if (!sql_query) {
        const ApiError = require('../../../utils/ApiError');
        throw ApiError.badRequest('请输入SQL查询语句');
      }

      const result = await apiBuilderService.executeSql(sql_query, parameters || {});
      success(res, result, '执行成功');
    } catch (error) {
      logger.error('Error executing SQL:', error);
      next(error);
    }
  }
}

module.exports = new ApiBuilderController();
