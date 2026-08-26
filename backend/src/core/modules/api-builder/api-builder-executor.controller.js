const apiBuilderService = require('./api-builder.service');
const apiBuilderExecutorService = require('./api-builder-executor.service');
const apiKeyService = require('./api-key.service');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');

class ApiBuilderExecutorController {
  /**
   * 测试接口
   * POST /api/api-builder/:id/test
   */
  async testInterface(req, res) {
    try {
      const { id } = req.params;
      const params = req.body.params || {};
      // 获取接口配置
      const interface_ = await apiBuilderService.getInterfaceById(id);

      // 执行测试
      const result = await apiBuilderExecutorService.testInterface(
        interface_,
        params,
        req.clientIp,
        null
      );

      res.json({
        success: true,
        message: '接口测试成功',
        data: {
          rows: result,
          rowCount: Array.isArray(result) ? result.length : 0,
        },
      });
    } catch (error) {
      logger.error('Error testing interface:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '接口测试失败',
      });
    }
  }

  /**
   * 执行动态API接口
   * GET/POST/PUT/DELETE /api/custom/*?version=1
   */
  async executeCustomApi(req, res) {
    try {
      // 从通配符参数中获取完整的端点路径
      // 使用 '/*' 时，Express会将匹配的路径放在 params[0] 中
      // 需要添加 /custom 前缀，因为数据库中存储的endpoint包含/custom前缀
      const endpoint = `/custom/${req.params[0]}`;
      const version = parseInt(req.query.version) || 1;
      const method = req.method;

      // 查找接口配置
      const interface_ = await this.findInterface(endpoint, version, method);

      // 检查认证要求
      if (interface_.require_auth) {
        // 接口需要认证，检查是否有有效的API密钥
        // 注意：生成的接口不走内部token鉴权，只支持API Key鉴权
        if (!req.sqlApiKey) {
          throw ApiError.unauthorized('未提供有效的API密钥');
        }
        await apiKeyService.authorizeInterface(req.sqlApiKey, interface_);
      }
      // 如果接口不需要认证，直接继续执行

      // 收集参数（支持GET和POST）
      const params = {
        ...req.query,
        ...req.body,
      };

      // 移除内部参数
      delete params.version;
      delete params.api_key;

      // 执行接口
      const result = await apiBuilderExecutorService.executeInterface(
        interface_,
        params,
        req.clientIp,
        req.sqlApiKey?.id || null
      );

      res.json({
        success: true,
        message: '接口调用成功',
        data: result,
        meta: {
          endpoint: interface_.endpoint,
          version: interface_.version,
          rowCount: Array.isArray(result) ? result.length : 0,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error executing custom API:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '接口调用失败',
      });
    }
  }

  /**
   * 根据端点和版本查找接口
   */
  async findInterface(endpoint, version = 1, method = 'GET') {
    const db = require('../../../models');
    const interface_ = await db.ApiInterface.findOne({
      where: {
        endpoint,
        version,
        status: 'active',
      },
    });

    if (!interface_) {
      throw ApiError.notFound(`接口不存在: ${endpoint} v${version}`);
    }

    // 检查请求方法是否匹配
    if (interface_.method !== method) {
      throw ApiError.badRequest(`接口不支持 ${method} 方法，仅支持 ${interface_.method}`);
    }

    return interface_;
  }
}

module.exports = new ApiBuilderExecutorController();
