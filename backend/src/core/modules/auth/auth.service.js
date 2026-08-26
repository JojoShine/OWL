const crypto = require('crypto');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const captchaService = require('../captcha/captcha.service');
const { getLocationFromIP } = require('../../../utils/geo-ip');
const { parseUserAgent } = require('../../../utils/user-agent-parser');
const { notifyKickedSessions } = require('../../../utils/session-handler');
const jwtUtil = require('../../../utils/jwt.util');

class AuthService {
  /**
   * 用户注册
   */
  async register(userData) {
    const { username, email, password, real_name, phone } = userData;

    // 检查用户名是否已存在
    const existingUser = await db.User.findOne({
      where: { username },
    });

    if (existingUser) {
      throw ApiError.badRequest('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await db.User.findOne({
      where: { email },
    });

    if (existingEmail) {
      throw ApiError.badRequest('邮箱已被注册');
    }

    // 如果提供了手机号，检查是否已存在
    if (phone) {
      const existingPhone = await db.User.findOne({
        where: { phone },
      });

      if (existingPhone) {
        throw ApiError.badRequest('手机号已被注册');
      }
    }

    // 创建用户
    const user = await db.User.create({
      username,
      email,
      password, // 会被model的hook自动加密
      real_name,
      phone,
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
    }

    logger.info(`User registered: ${username}`);

    return user.toSafeJSON();
  }

  /**
   * 用户登录
   */
  async login(credentials, deviceInfo = null, ipAddress = null) {
    const { username, password, captchaId, captchaCode } = credentials;

    // 用户名/密码认证模式
    // 验证验证码
    const isCaptchaValid = await captchaService.verifyCaptcha(captchaId, captchaCode);
    if (!isCaptchaValid) {
      throw ApiError.badRequest('验证码错误或已过期');
    }

    // 查找用户并加载角色
    const user = await db.User.findOne({
      where: { username },
      include: [
        {
          model: db.Role,
          as: 'roles',
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      throw ApiError.unauthorized('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status === 'inactive') {
      throw ApiError.forbidden('账户已被禁用');
    }

    if (user.status === 'banned') {
      throw ApiError.forbidden('账户已被封禁');
    }

    // 踢出该用户的所有活跃会话（单设备登录控制）
    if (db.UserSession) {
      const activeSessions = await db.UserSession.findAll({
        where: {
          user_id: user.id,
          status: 'active'
        }
      });

      if (activeSessions.length > 0) {
        // 准备被踢出通知信息
        const locationInfo = getLocationFromIP(ipAddress);
        const kickNotification = {
          device: deviceInfo.device_name,
          location: `${locationInfo.city}, ${locationInfo.country}`,
          time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        };

        // 通过WebSocket通知被踢出的用户
        try {
          notifyKickedSessions(user.id, kickNotification);
          logger.info(`Notified user ${username} about kicked sessions`);
        } catch (error) {
          logger.error(`Error notifying kicked sessions for user ${username}: ${error.message}`);
        }

        // 标记旧会话为已踢出
        await db.UserSession.update(
          {
            status: 'kicked',
            kicked_at: new Date()
          },
          {
            where: {
              user_id: user.id,
              status: 'active'
            }
          }
        );

        logger.info(`Kicked out ${activeSessions.length} active session(s) for user: ${username}`);
      }
    }

    // 更新最后登录时间和IP
    await user.update({
      last_login_at: new Date(),
      last_login_ip: ipAddress || null
    });

    // 生成token
    const token = this.generateToken(user);

    // 如果有设备信息，创建会话记录
    if (db.UserSession && deviceInfo && ipAddress) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const locationInfo = getLocationFromIP(ipAddress);

      await db.UserSession.create({
        user_id: user.id,
        session_token: tokenHash,
        device_info: deviceInfo,
        location_info: locationInfo,
        login_at: new Date(),
        last_active_at: new Date(),
        status: 'active'
      });

      logger.info(`Created new session for user: ${username}, device: ${deviceInfo.device_name}`);
    }

    logger.info(`User logged in: ${username}`);

    // 重新加载用户信息，包含完整的角色和权限
    const userWithPermissions = await db.User.findByPk(user.id, {
      include: [
        {
          model: db.Role,
          as: 'roles',
          through: { attributes: [] },
          include: [
            {
              model: db.Permission,
              as: 'permissions',
              through: { attributes: [] },
            },
          ],
        },
        {
          model: db.Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
      ],
    });

    return {
      token,
      user: userWithPermissions.toSafeJSON(),
    };
  }

  /**
   * 生成JWT Token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    return jwtUtil.generateToken(payload);
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId) {
    const user = await db.User.findByPk(userId, {
      include: [
        {
          model: db.Role,
          as: 'roles',
          through: { attributes: [] },
          include: [
            {
              model: db.Permission,
              as: 'permissions',
              through: { attributes: [] },
            },
            {
              model: db.Menu,
              as: 'menus',
              through: { attributes: [] },
            },
          ],
        },
        {
          model: db.Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!user) {
      throw ApiError.notFound('用户不存在');
    }

    return user.toSafeJSON();
  }

  /**
   * 修改密码
   */
  async changePassword(userId, passwords) {
    const { oldPassword, newPassword } = passwords;

    const user = await db.User.findByPk(userId);

    if (!user) {
      throw ApiError.notFound('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await user.validatePassword(oldPassword);
    if (!isPasswordValid) {
      throw ApiError.badRequest('原密码错误');
    }

    // 更新密码
    await user.update({ password: newPassword });

    logger.info(`User changed password: ${user.username}`);

    return { message: '密码修改成功' };
  }

  /**
   * 刷新Token
   */
  async refreshToken(userId) {
    const user = await db.User.findByPk(userId);

    if (!user) {
      throw ApiError.notFound('用户不存在');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden('账户状态异常');
    }

    const token = this.generateToken(user);

    return { token };
  }
}

module.exports = new AuthService();
