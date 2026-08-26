const dataSecurityService = require('./data-security.service');
const plainAccessService = require('./plain-access.service');
const { success, paginated } = require('../../../utils/response');

class DataSecurityController {
  /**
   * 获取敏感字段列表
   * GET /api/system/data-security/fields
   */
  async getSensitiveFields(req, res, next) {
    try {
      const result = await dataSecurityService.getSensitiveFields(req.query);
      paginated(res, result.data, result.pagination, '获取敏感字段列表成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取敏感字段详情
   * GET /api/system/data-security/fields/:id
   */
  async getSensitiveFieldById(req, res, next) {
    try {
      const field = await dataSecurityService.getSensitiveFieldById(req.params.id);
      success(res, field, '获取敏感字段详情成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建敏感字段配置
   * POST /api/system/data-security/fields
   */
  async createSensitiveField(req, res, next) {
    try {
      const field = await dataSecurityService.createSensitiveField(req.body);
      success(res, field, '创建敏感字段配置成功', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新敏感字段配置
   * PUT /api/system/data-security/fields/:id
   */
  async updateSensitiveField(req, res, next) {
    try {
      const field = await dataSecurityService.updateSensitiveField(
        req.params.id,
        req.body
      );
      success(res, field, '更新敏感字段配置成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除敏感字段配置
   * DELETE /api/system/data-security/fields/:id
   */
  async deleteSensitiveField(req, res, next) {
    try {
      await dataSecurityService.deleteSensitiveField(req.params.id);
      success(res, null, '删除敏感字段配置成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量导入敏感字段配置
   * POST /api/system/data-security/fields/import
   */
  async batchImportSensitiveFields(req, res, next) {
    try {
      const { fields } = req.body;
      
      if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的字段配置数组',
        });
      }

      const results = await dataSecurityService.batchImportSensitiveFields(fields);
      
      success(res, results, `导入完成：成功${results.success}条，失败${results.failed}条`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 验证密码（用于前端测试）
   * POST /api/system/data-security/validate-password
   */
  async validatePassword(req, res, next) {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      await dataSecurityService.validatePasswordWithAttempts(userId, password, {
        ipAddress: req.clientIp,
        userAgent: req.get('user-agent'),
      });

      success(res, null, '密码验证成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 申请明文访问权限
   * POST /api/system/data-security/request-plain-access
   */
  async requestPlainAccess(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await plainAccessService.requestPlainAccess(userId, req.body, {
        ipAddress: req.clientIp,
        userAgent: req.get('user-agent'),
      });
      success(res, result, '申请成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 检查明文访问权限
   * GET /api/system/data-security/check-permission
   */
  async checkPlainAccessPermission(req, res, next) {
    try {
      const { table_name, field_name, record_id } = req.query;
      const userId = req.user.id;

      const result = await plainAccessService.checkPlainAccessPermission(
        userId,
        table_name,
        field_name,
        record_id
      );

      success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取统计信息
   * GET /api/system/data-security/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await dataSecurityService.getStatistics();
      success(res, stats, '获取统计信息成功');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DataSecurityController();
