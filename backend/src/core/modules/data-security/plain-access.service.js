const { redisClient, isRedisAvailable } = require('../../../config/redis');
const { logger, operationLogger, databaseAccessLogger } = require('../../../config/logger');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');

// 从环境变量获取明文访问权限有效期（秒），默认600秒（10分钟）
const PLAIN_ACCESS_EXPIRY = parseInt(process.env.PLAIN_ACCESS_EXPIRY) || 600;

class PlainAccessService {
  /**
   * 生成缓存Key（仅支持记录级别）
   */
  getCacheKey(userId, tableName, fieldName, recordId) {
    return `plain_access:${userId}:${tableName}:${fieldName}:${recordId}`;
  }

  /**
   * 申请明文访问权限（验证密码并授予权限）
   * 必须提供recordId，精确到某条记录
   */
  async requestPlainAccess(userId, data, reqInfo) {
    try {
      // 1. 检查Redis是否可用
      if (!isRedisAvailable()) {
        throw ApiError.serviceUnavailable('Redis服务不可用，暂时无法申请明文访问权限');
      }

      // 2. 获取用户信息
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw ApiError.notFound('用户不存在');
      }

      // 3. 验证密码
      const isValid = await user.validatePassword(data.password);
      if (!isValid) {
        // 记录失败的尝试
        logger.info(JSON.stringify({
          type: 'sensitive_data_access',
          action: 'password_verify_failed',
          user_id: userId,
          username: user.username,
          table_name: data.table_name,
          field_name: data.field_name,
          record_id: data.record_id,
          ip_address: reqInfo.ipAddress,
          user_agent: reqInfo.userAgent,
          timestamp: new Date().toISOString(),
        }));
        throw ApiError.unauthorized('密码错误');
      }

      // 4. 设置权限（有效期从环境变量读取，单位：秒）
      // 存储两个Key：
      // 1. 精确表名的Key（用于前端查询权限状态）
      const exactCacheKey = this.getCacheKey(userId, data.table_name, data.field_name, data.record_id);
      // 2. 通配符表名的Key（用于后端脱敏中间件检查）
      const wildcardCacheKey = this.getCacheKey(userId, '*', data.field_name, data.record_id);
      
      const permissionData = {
        userId,
        username: user.username,
        tableName: data.table_name,
        fieldName: data.field_name,
        recordId: data.record_id,
        reason: data.reason,
        grantedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + PLAIN_ACCESS_EXPIRY * 1000).toISOString(),
      };

      // 记录Redis写入操作
      databaseAccessLogger.info(JSON.stringify({
        type: 'redis',
        action: 'set',
        business_type: 'plain_access_grant',
        keys: [exactCacheKey, wildcardCacheKey],
        ttl: PLAIN_ACCESS_EXPIRY,
        user_id: userId,
        username: user.username,
        table_name: data.table_name,
        field_name: data.field_name,
        record_id: data.record_id,
        reason: data.reason,
        timestamp: new Date().toISOString(),
      }));

      // 同时设置两个Key，都指向相同的权限数据
      await redisClient.setEx(exactCacheKey, PLAIN_ACCESS_EXPIRY, JSON.stringify(permissionData));
      await redisClient.setEx(wildcardCacheKey, PLAIN_ACCESS_EXPIRY, JSON.stringify(permissionData));

      // 5. 记录成功的审计日志
      logger.info(JSON.stringify({
        type: 'sensitive_data_access',
        action: 'plain_access_granted',
        user_id: userId,
        username: user.username,
        table_name: data.table_name,
        field_name: data.field_name,
        record_id: data.record_id,
        reason: data.reason,
        ip_address: reqInfo.ipAddress,
        user_agent: reqInfo.userAgent,
        expires_at: permissionData.expiresAt,
        access_level: 'record',
        timestamp: new Date().toISOString(),
      }));

      return {
        success: true,
        message: `已授权查看该记录的明文，有效期${PLAIN_ACCESS_EXPIRY}秒`,
        expiresAt: permissionData.expiresAt,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // 注意：不要记录完整的error对象，可能包含敏感信息
      logger.error('申请明文访问权限失败:', {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      throw ApiError.internal('申请失败');
    }
  }

  /**
   * 检查用户是否有明文访问权限（记录级别）
   */
  async checkPlainAccessPermission(userId, tableName, fieldName, recordId) {
    try {
      // Redis不可用时，直接返回无权限
      if (!isRedisAvailable()) {
        return {
          hasPermission: false,
          message: 'Redis服务不可用',
          redisAvailable: false,
        };
      }

      if (!recordId) {
        return {
          hasPermission: false,
          message: '缺少记录ID',
          redisAvailable: true,
        };
      }

      const cacheKey = this.getCacheKey(userId, tableName, fieldName, recordId);
      
      // 记录Redis读取操作
      databaseAccessLogger.info(JSON.stringify({
        type: 'redis',
        action: 'get',
        business_type: 'plain_access_check',
        key: cacheKey,
        user_id: userId,
        table_name: tableName,
        field_name: fieldName,
        record_id: recordId,
        timestamp: new Date().toISOString(),
      }));
      
      const data = await redisClient.get(cacheKey);

      if (data) {
        const permissionData = JSON.parse(data);
        return {
          hasPermission: true,
          expiresAt: permissionData.expiresAt,
          accessLevel: 'record',
          message: '您有该记录的明文查看权限',
          redisAvailable: true,
        };
      }

      return {
        hasPermission: false,
        message: '您暂无明文查看权限，请提交申请',
        redisAvailable: true,
      };
    } catch (error) {
      // 注意：不要记录完整的error对象，可能包含敏感信息
      logger.error('检查明文访问权限失败:', {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      return {
        hasPermission: false,
        message: '权限检查失败',
        redisAvailable: isRedisAvailable(),
      };
    }
  }

  /**
   * 撤销明文访问权限
   */
  async revokePlainAccess(userId, tableName, fieldName, recordId) {
    try {
      if (!isRedisAvailable()) {
        return false;
      }

      const cacheKey = this.getCacheKey(userId, tableName, fieldName, recordId);
      
      // 记录Redis删除操作
      databaseAccessLogger.info(JSON.stringify({
        type: 'redis',
        action: 'del',
        business_type: 'plain_access_revoke',
        key: cacheKey,
        user_id: userId,
        table_name: tableName,
        field_name: fieldName,
        record_id: recordId,
        timestamp: new Date().toISOString(),
      }));
      
      await redisClient.del(cacheKey);

      logger.info(`撤销明文访问权限: ${cacheKey}`);
      return true;
    } catch (error) {
      // 注意：不要记录完整的error对象，可能包含敏感信息
      logger.error('撤销明文访问权限失败:', {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      return false;
    }
  }

  async checkPlainAccessPermissions(userId, tableName, entries) {
    if (!isRedisAvailable() || !Array.isArray(entries) || entries.length === 0) {
      return new Set();
    }

    const uniqueEntries = Array.from(
      new Map(
        entries
          .filter(({ fieldName, recordId }) => fieldName && recordId)
          .map((entry) => [`${entry.fieldName}:${entry.recordId}`, entry])
      ).entries()
    );

    if (uniqueEntries.length === 0) return new Set();

    const keys = uniqueEntries.map(([, { fieldName, recordId }]) => (
      this.getCacheKey(userId, tableName, fieldName, recordId)
    ));

    databaseAccessLogger.info(JSON.stringify({
      type: 'redis',
      action: 'mget',
      business_type: 'plain_access_batch_check',
      key_count: keys.length,
      user_id: userId,
      timestamp: new Date().toISOString(),
    }));

    try {
      const values = await redisClient.mGet(keys);
      return new Set(
        uniqueEntries
          .filter((_, index) => Boolean(values[index]))
          .map(([identity]) => identity)
      );
    } catch (error) {
      logger.error('批量检查明文访问权限失败:', { message: error.message });
      return new Set();
    }
  }
}

module.exports = new PlainAccessService();
