/**
 * 短信验证码登录服务
 * 支持两种模式：
 * 1. 普通短信服务 (Dysmsapi) - 使用Redis存储验证码
 * 2. 短信认证服务 (OneVerify) - 不使用Redis，通过阿里云验证
 */
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const jwtUtil = require('../../../utils/jwt.util');
const { redisClient, isRedisAvailable } = require('../../../config/redis');
const aliyunSMS = require('../../../utils/aliyun-sms');
const config = require('../../../config/aliyun');

class SMSService {
  constructor() {
    // 判断是否使用短信认证服务
    this.isOneVerify = config.sms.serviceType === 'oneverify';
  }

  /**
   * 生成安全的6位数字验证码（仅普通短信服务使用）
   */
  generateSecureCode() {
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    return (num % 900000 + 100000).toString();
  }

  /**
   * 检查发送频率限制（仅普通短信服务使用）
   */
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

  /**
   * 更新发送频率限制（仅普通短信服务使用）
   */
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

  /**
   * 发送验证码
   */
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

  /**
   * 验证验证码
   */
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

  /**
   * 短信登录（自动注册）
   */
  async loginByPhone(phoneNumber, code) {
    // 1. 验证验证码
    await this.verifyCode(phoneNumber, code);

    // 2. 查找或创建用户（直接通过手机号在users表中查找）
    let user = await db.User.findOne({
      where: { phone: phoneNumber },
      include: [{
        model: db.Role,
        as: 'roles',
        through: { attributes: [] },
      }, {
        model: db.Department,
        as: 'department',
        attributes: ['id', 'name'],
      }],
    });

    if (!user) {
      // 新用户，自动注册
      const username = `user_${phoneNumber.slice(-4)}`;
      const email = `${phoneNumber}@sms.temp`;
      
      // 检查用户名是否已存在
      let finalUsername = username;
      let counter = 1;
      while (await db.User.findOne({ where: { username: finalUsername } })) {
        finalUsername = `${username}_${counter}`;
        counter++;
      }

      user = await db.User.create({
        username: finalUsername,
        email,
        phone: phoneNumber,
        real_name: `用户${phoneNumber.slice(-4)}`,
        status: 'active',
        password: null, // 无密码，仅通过短信登录
      });

      // 分配默认角色（普通用户）
      const defaultRole = await db.Role.findOne({
        where: { code: 'user' },
      });

      if (defaultRole) {
        await db.UserRole.create({
          user_id: user.id,
          role_id: defaultRole.id,
        });
        logger.info(`为用户 ${finalUsername} 分配默认角色: user`);
      }

      logger.info(`新用户通过短信注册并登录: ${phoneNumber}, 用户名: ${finalUsername}`);
    } else {
      if (user.status !== 'active') {
        throw ApiError.forbidden('账户状态异常');
      }

      // 更新最后登录时间
      await user.update({ last_login_at: new Date() });
    }

    // 生成token
    const token = jwtUtil.generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    logger.info(`用户通过短信登录: ${user.username}`);

    const userWithProfile = await db.User.findByPk(user.id, {
      include: [{
        model: db.Role,
        as: 'roles',
        through: { attributes: [] },
      }, {
        model: db.Department,
        as: 'department',
        attributes: ['id', 'name'],
      }],
    });

    return {
      token,
      user: userWithProfile.toSafeJSON(),
    };
  }
}

module.exports = new SMSService();
