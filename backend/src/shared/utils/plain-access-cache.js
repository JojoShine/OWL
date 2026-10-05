const { redisClient, isRedisAvailable } = require('../config/redis');
const { logger, databaseAccessLogger } = require('../config/logger');
class PlainAccessCache {
getCacheKey(userId, tableName, fieldName, recordId) {
    return `plain_access:${userId}:${tableName}:${fieldName}:${recordId}`;
  }

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
module.exports = PlainAccessCache;
