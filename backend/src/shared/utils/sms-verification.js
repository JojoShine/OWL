const ApiError = require('./ApiError');
const { logger } = require('../config/logger');
const { redisClient, isRedisAvailable } = require('../config/redis');
const aliyunSMS = require('./aliyun-sms');
const config = require('../config/aliyun');
class SmsVerification {
constructor() {
    // 判断是否使用短信认证服务
    this.isOneVerify = config.sms.serviceType === 'oneverify';
  }

generateSecureCode() {
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    return (num % 900000 + 100000).toString();
  }

async checkRateLimit(phoneNumber, ip) {
    // 短信认证服务不需要频率限制（阿里云自带限流）
    if (this.isOneVerify) {
      return;
    }

    // 检查Redis是否可用
    if (!isRedisAvailable()) {
      throw ApiError.internal('Redis服务不可用，请稍后重试');
    }

    // 1. 60秒间隔限制
    const intervalKey = `sms:limit:${phoneNumber}:interval`;
    const hasInterval = await redisClient.exists(intervalKey);
    if (hasInterval) {
      throw ApiError.badRequest('请60秒后再试');
    }

    // 2. 单日次数限制(同一手机号，最多10次)
    const dailyKey = `sms:limit:${phoneNumber}:daily`;
    const dailyCount = parseInt(await redisClient.get(dailyKey) || '0');
    if (dailyCount >= 10) {
      throw ApiError.badRequest('今日发送次数已达上限(10次)');
    }

    // 3. IP级别限制(防止恶意攻击，最多50次/天)
    if (ip) {
      const ipKey = `sms:limit:ip:${ip}:daily`;
      const ipCount = parseInt(await redisClient.get(ipKey) || '0');
      if (ipCount >= 50) {
        throw ApiError.badRequest('IP请求过于频繁');
      }
    }
  }

async updateRateLimit(phoneNumber, ip) {
    // 短信认证服务不需要频率限制
    if (this.isOneVerify) {
      return;
    }

    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ttlSeconds = Math.floor((endOfDay - now) / 1000);

    // 60秒间隔
    await redisClient.setEx(`sms:limit:${phoneNumber}:interval`, 60, '1');

    // 每日计数
    const dailyKey = `sms:limit:${phoneNumber}:daily`;
    await redisClient.incr(dailyKey);
    await redisClient.expire(dailyKey, ttlSeconds);

    // IP每日计数
    if (ip) {
      const ipKey = `sms:limit:ip:${ip}:daily`;
      await redisClient.incr(ipKey);
      await redisClient.expire(ipKey, ttlSeconds);
    }
  }

async sendVerificationCode(phoneNumber, ip) {
    // 1. 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      throw ApiError.badRequest('手机号格式不正确');
    }

    // 2. 频率限制检查（仅普通短信服务）
    await this.checkRateLimit(phoneNumber, ip);

    let code = null;

    if (this.isOneVerify) {
      // 号码认证服务：也需要生成验证码并传递给阿里云
      code = this.generateSecureCode();
      const key = `sms:code:${phoneNumber}`;
      await redisClient.setEx(key, 300, code);
      logger.info(`使用号码认证服务发送验证码: ${phoneNumber}`);
    } else {
      // 普通短信服务：生成并存储验证码到Redis
      code = this.generateSecureCode();
      const key = `sms:code:${phoneNumber}`;
      await redisClient.setEx(key, 300, code);
      logger.info(`验证码已生成并存储: ${phoneNumber}`);
    }

    // 3. 调用阿里云短信服务
    try {
      const result = await aliyunSMS.sendVerificationCode(phoneNumber, code);
      
      // 4. 更新频率限制
      await this.updateRateLimit(phoneNumber, ip);
      
      logger.info(`验证码已发送到 ${phoneNumber}`);
      return { message: '验证码已发送', bizId: result.bizId };
    } catch (error) {
      // 发送失败，删除验证码
      if (code) {
        const key = `sms:code:${phoneNumber}`;
        await redisClient.del(key);
      }
      logger.error(`短信发送失败: ${phoneNumber}`, error);
      throw ApiError.internal('短信发送失败，请稍后重试');
    }
  }

async verifyCode(phoneNumber, code) {
    // 两种模式都使用Redis验证
    const key = `sms:code:${phoneNumber}`;
    
    // 检查是否被锁定
    const locked = await redisClient.exists(`${key}:locked`);
    if (locked) {
      throw ApiError.badRequest('验证失败次数过多，请5分钟后重试');
    }

    const storedCode = await redisClient.get(key);

    if (!storedCode) {
      throw ApiError.badRequest('验证码已过期');
    }

    if (storedCode !== code) {
      // 记录失败次数
      const failKey = `sms:fail:${phoneNumber}`;
      const failCount = await redisClient.incr(failKey);
      await redisClient.expire(failKey, 300);

      if (failCount >= 5) {
        // 锁定5分钟
        await redisClient.setEx(`${key}:locked`, 300, '1');
        throw ApiError.badRequest('验证失败次数过多，请5分钟后重试');
      }

      throw ApiError.badRequest('验证码错误');
    }

    // 验证成功，立即删除
    await redisClient.del(key);
    return true;
  }
}
module.exports = SmsVerification;
