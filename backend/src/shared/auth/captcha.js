const svgCaptcha = require('svg-captcha');
const { v4: uuidv4 } = require('uuid');
const { redisClient, isRedisAvailable } = require('../config/redis');
const { logger } = require('../config/logger');

class CaptchaService {
  constructor() {
    // 算术验证码配置
    this.mathCaptchaConfig = {
      mathMin: 1,            // 最小数字
      mathMax: 10,           // 最大数字
      mathOperator: '+|-',   // 运算符：加减法
      width: 150,            // 宽度
      height: 40,            // 高度（与input高度一致）
      fontSize: 50,          // 字体大小（增大以更清晰）
      color: true,           // 彩色验证码
      background: '#f7f8fa', // 背景色
      noise: 0,              // 干扰线数量（去除干扰线，让运算符更清晰）
      charPreset: '0123456789+-', // 只使用数字和运算符
    };

    this.captchaPrefix = 'captcha:';
    this.captchaExpire = 300; // 5分钟过期（秒）

    // 内存存储（当Redis不可用时使用）
    this.memoryStore = new Map();

    // 启动定时清理任务（每分钟清理一次过期验证码）
    this.startCleanupTask();
  }

  /**
   * 启动定时清理过期验证码任务
   */
  startCleanupTask() {
    setInterval(() => {
      if (!isRedisAvailable()) {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, value] of this.memoryStore.entries()) {
          if (now > value.expireAt) {
            this.memoryStore.delete(key);
            cleanedCount++;
          }
        }

        if (cleanedCount > 0) {
          logger.debug(`清理了 ${cleanedCount} 个过期验证码（内存存储）`);
        }
      }
    }, 60000).unref(); // 每分钟执行一次，不阻止服务退出
  }

  /**
   * 生成算术验证码
   * @returns {Promise<{captchaId: string, captchaSvg: string}>}
   */
  async generateCaptcha() {
    try {
      // 生成数学表达式验证码
      const captcha = svgCaptcha.createMathExpr(this.mathCaptchaConfig);

      // 生成唯一ID
      const captchaId = uuidv4();

      // 根据 Redis 可用性选择存储方式
      if (isRedisAvailable()) {
        // 使用 Redis 存储
        const key = `${this.captchaPrefix}${captchaId}`;
        await redisClient.setEx(key, this.captchaExpire, captcha.text);
        logger.debug(`验证码已存储到 Redis: ${captchaId}`);
      } else {
        // 使用内存存储
        const expireAt = Date.now() + this.captchaExpire * 1000;
        this.memoryStore.set(captchaId, {
          answer: captcha.text,
          expireAt,
        });
        logger.debug(`验证码已存储到内存: ${captchaId}`);
      }

      return {
        captchaId,
        captchaSvg: captcha.data,
      };
    } catch (error) {
      throw new Error(`生成验证码失败: ${error.message}`);
    }
  }

  /**
   * 验证算术验证码
   * @param {string} captchaId - 验证码ID
   * @param {string} captchaCode - 用户输入的答案
   * @returns {Promise<boolean>}
   */
  async verifyCaptcha(captchaId, captchaCode) {
    try {
      if (!captchaId || !captchaCode) {
        return false;
      }

      let storedAnswer = null;

      // 根据 Redis 可用性选择读取方式
      if (isRedisAvailable()) {
        // 从 Redis 读取
        const key = `${this.captchaPrefix}${captchaId}`;
        storedAnswer = await redisClient.get(key);

        if (storedAnswer) {
          // 删除已使用的验证码（一次性使用）
          await redisClient.del(key);
          logger.debug(`验证码已从 Redis 验证并删除: ${captchaId}`);
        }
      } else {
        // 从内存读取
        const captchaData = this.memoryStore.get(captchaId);

        if (captchaData) {
          const now = Date.now();

          // 检查是否过期
          if (now <= captchaData.expireAt) {
            storedAnswer = captchaData.answer;
            // 删除已使用的验证码（一次性使用）
            this.memoryStore.delete(captchaId);
            logger.debug(`验证码已从内存验证并删除: ${captchaId}`);
          } else {
            // 已过期，删除
            this.memoryStore.delete(captchaId);
            logger.debug(`验证码已过期: ${captchaId}`);
          }
        }
      }

      if (!storedAnswer) {
        // 验证码不存在或已过期
        return false;
      }

      // 验证答案（转换为数字比较，避免字符串问题）
      const userAnswer = parseInt(captchaCode, 10);
      const correctAnswer = parseInt(storedAnswer, 10);

      return !isNaN(userAnswer) && userAnswer === correctAnswer;
    } catch (error) {
      throw new Error(`验证验证码失败: ${error.message}`);
    }
  }

  /**
   * 清除过期验证码
   * Redis会自动清除，这个方法主要用于手动清理或测试
   */
  async clearExpiredCaptchas() {
    try {
      let cleared = 0;

      if (isRedisAvailable()) {
        // 清理 Redis 中的验证码
        const pattern = `${this.captchaPrefix}*`;
        const keys = await redisClient.keys(pattern);

        if (keys.length > 0) {
          await redisClient.del(keys);
          cleared = keys.length;
        }
      } else {
        // 清理内存中的验证码
        cleared = this.memoryStore.size;
        this.memoryStore.clear();
      }

      return { cleared };
    } catch (error) {
      throw new Error(`清除验证码失败: ${error.message}`);
    }
  }
}

module.exports = new CaptchaService();
