const redis = require('redis');
const { logger } = require('./logger');

// ========== 配置参数 ==========
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  // 连接超时：5秒
  connectTimeout: 5000,
  // 命令超时：3秒（避免命令挂起）
  commandTimeout: 3000,
  // 最大重连次数
  maxReconnectAttempts: 10,
  // 健康检查间隔：30秒
  healthCheckInterval: 30000,
};

// ========== 状态管理 ==========
let isAvailable = false;
let reconnectAttempts = 0;
let healthCheckTimer = null;

// ========== 创建客户端 ==========
const redisClient = redis.createClient({
  socket: {
    host: REDIS_CONFIG.host,
    port: REDIS_CONFIG.port,
    connectTimeout: REDIS_CONFIG.connectTimeout,
    // 指数退避重连策略
    reconnectStrategy: (retries) => {
      if (retries >= REDIS_CONFIG.maxReconnectAttempts) {
        logger.warn(`Redis 重连已达最大次数(${REDIS_CONFIG.maxReconnectAttempts})，停止重连`);
        isAvailable = false;
        return false;
      }
      // 指数退避：100ms, 200ms, 400ms, 800ms... 最大 5s
      const delay = Math.min(Math.pow(2, retries) * 100, 5000);
      logger.debug(`Redis 第 ${retries + 1} 次重连，延迟 ${delay}ms`);
      return delay;
    },
  },
  // 命令超时
  commandsQueueMaxLength: 100, // 限制队列长度，防止内存溢出
  username: REDIS_CONFIG.username,
  password: REDIS_CONFIG.password,
});

// ========== 事件监听 ==========

redisClient.on('error', (err) => {
  isAvailable = false;
  // 只在重连初期记录警告，后续静默处理
  if (reconnectAttempts < 3) {
    logger.warn(`Redis 连接错误: ${err.message}`);
    reconnectAttempts++;
  }
});

redisClient.on('connect', () => {
  logger.info('Redis 连接成功');
  isAvailable = true;
  reconnectAttempts = 0; // 重置重连计数
});

redisClient.on('reconnecting', () => {
  logger.debug('Redis 正在重连...');
});

redisClient.on('end', () => {
  if (isAvailable) {
    logger.warn('Redis 连接已断开');
  }
  isAvailable = false;
  stopHealthCheck();
});

// ========== 健康检查 ==========

/**
 * 启动定期健康检查（PING）
 * 检测连接是否真正可用，防止假活连接
 */
function startHealthCheck() {
  stopHealthCheck(); // 先清除已有的定时器

  healthCheckTimer = setInterval(async () => {
    if (!redisClient.isOpen) {
      isAvailable = false;
      return;
    }

    try {
      const result = await redisClient.ping();
      if (result === 'PONG') {
        isAvailable = true;
        reconnectAttempts = 0;
      }
    } catch (err) {
      logger.debug(`Redis 健康检查失败: ${err.message}`);
      isAvailable = false;

      // 尝试手动重连
      try {
        if (redisClient.isOpen) {
          await redisClient.disconnect();
        }
        await redisClient.connect();
        logger.info('Redis 健康检查触发重连成功');
      } catch (reconnectErr) {
        logger.debug(`Redis 手动重连失败: ${reconnectErr.message}`);
      }
    }
  }, REDIS_CONFIG.healthCheckInterval);

  // 确保定时器不阻止进程退出
  if (healthCheckTimer.unref) {
    healthCheckTimer.unref();
  }
}

/**
 * 停止健康检查
 */
function stopHealthCheck() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

// ========== 连接函数 ==========

/**
 * 连接 Redis（带重试）
 */
const connectRedis = async () => {
  try {
    if (redisClient.isOpen) {
      logger.info('Redis 已处于连接状态');
      isAvailable = true;
      startHealthCheck();
      return;
    }

    await redisClient.connect();
    isAvailable = true;

    // 启动健康检查
    startHealthCheck();
  } catch (error) {
    isAvailable = false;
    logger.warn('Redis 连接失败，系统将使用内存存储作为备选方案:', error.message);
    logger.warn('如需使用 Redis，请检查配置：REDIS_HOST, REDIS_PORT, REDIS_USERNAME (可选), REDIS_PASSWORD');
  }
};

// ========== 安全操作封装 ==========

/**
 * 安全执行 Redis 命令
 * 当 Redis 不可用时直接返回 null，不抛出异常
 * @param {Function} operation - Redis 操作函数
 * @param {string} operationName - 操作名称（用于日志）
 * @returns {Promise<any>}
 */
const safeExecute = async (operation, operationName = 'unknown') => {
  if (!isAvailable || !redisClient.isOpen) {
    return null;
  }

  try {
    return await Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis 命令超时')), REDIS_CONFIG.commandTimeout)
      ),
    ]);
  } catch (error) {
    logger.debug(`Redis 操作 [${operationName}] 失败: ${error.message}`);
    isAvailable = false;
    return null;
  }
};

// ========== 导出 ==========

/**
 * 检查 Redis 是否可用
 * @returns {boolean}
 */
const isRedisAvailable = () => {
  return isAvailable && redisClient.isOpen;
};

module.exports = {
  redisClient,
  connectRedis,
  isRedisAvailable,
  safeExecute,
};
