const crypto = require('crypto');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const { success, created, list } = require('../../../utils/response');

class ApiBuilderKeysController {
  /**
   * 获取所有API密钥列表
   * GET /api-builder/keys
   */
  async getAllKeys(req, res, next) {
    try {
      const db = require('../../../models');
      const userId = req.user.id;

      logger.info('Fetching API keys for user:', userId);

      const keys = await db.ApiKey.findAll({
        where: {
          created_by: userId,
        },
        attributes: ['id', 'app_name', 'api_key', 'status', 'expires_at', 'last_used_at', 'created_at', 'updated_at'],
        order: [['created_at', 'DESC']],
        raw: true,
      });

      // 计算每个密钥的过期状态
      const keysWithStatus = keys.map(key => {
        let expireStatus = 'valid'; // 默认有效

        if (key.status === 'inactive') {
          expireStatus = 'inactive';
        } else if (new Date(key.expires_at) < new Date()) {
          expireStatus = 'expired';
        }

        return {
          ...key,
          expireStatus,
        };
      });

      success(res, keysWithStatus, '获取密钥列表成功');
    } catch (error) {
      logger.error('Error fetching API keys:', error.message);
      next(error);
    }
  }

  /**
   * 创建新的API密钥
   * POST /api-builder/keys
   */
  async createKey(req, res, next) {
    try {
      const db = require('../../../models');
      const { app_name } = req.body;
      const userId = req.user.id;

      if (!app_name || !app_name.trim()) {
        throw ApiError.badRequest('应用名称不能为空');
      }

      // 生成app_id (UUID)和app_key (随机字符串)
      const appId = crypto.randomUUID();
      const appKey = crypto.randomBytes(32).toString('hex');

      // 生成api_secret (HMAC-SHA256哈希)
      const apiSecret = crypto
        .createHmac('sha256', process.env.API_SECRET_KEY || process.env.JWT_SECRET)
        .update(appKey)
        .digest('hex');

      // 计算180天后的过期时间
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 180);

      const key = await db.ApiKey.create({
        id: appId,
        app_name: app_name.trim(),
        api_key: appKey,
        api_secret: apiSecret,
        expires_at: expiresAt,
        created_by: userId,
        interface_id: null, // 不关联特定接口
        status: 'active',
      });

      created(res, {
        id: key.id,
        app_name: key.app_name,
        api_key: key.api_key, // 只在创建时返回一次明文
        created_at: key.created_at,
      }, '密钥已创建');
    } catch (error) {
      logger.error('Error creating API key:', error.message);
      next(error);
    }
  }

  /**
   * 更新API密钥信息
   * PUT /api-builder/keys/:id
   */
  async updateKey(req, res, next) {
    try {
      const db = require('../../../models');
      const { id } = req.params;
      const { app_name } = req.body;
      const userId = req.user.id;

      if (!app_name || !app_name.trim()) {
        throw ApiError.badRequest('应用名称不能为空');
      }

      const key = await db.ApiKey.findOne({
        where: {
          id,
          created_by: userId,
        },
      });

      if (!key) {
        throw ApiError.notFound('密钥不存在');
      }

      key.app_name = app_name.trim();
      await key.save();

      success(res, key, '密钥已更新');
    } catch (error) {
      logger.error('Error updating API key:', error.message);
      next(error);
    }
  }

  /**
   * 删除API密钥
   * DELETE /api-builder/keys/:id
   */
  async deleteKey(req, res, next) {
    try {
      const db = require('../../../models');
      const { id } = req.params;
      const userId = req.user.id;

      const key = await db.ApiKey.findOne({
        where: {
          id,
          created_by: userId,
        },
      });

      if (!key) {
        throw ApiError.notFound('密钥不存在');
      }

      await key.destroy();

      success(res, null, '密钥已删除');
    } catch (error) {
      logger.error('Error deleting API key:', error.message);
      next(error);
    }
  }
}

module.exports = new ApiBuilderKeysController();