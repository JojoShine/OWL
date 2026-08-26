/**
 * 短信验证码登录控制器
 */
const smsService = require('./sms.service');
const { success } = require('../../../utils/response');
const { logger, loginLogger } = require('../../../config/logger');

class SMSController {
  /**
   * 发送验证码
   * POST /api/auth/sms/send-code
   */
  async sendCode(req, res, next) {
    try {
      const { phone } = req.body;
      const ip = req.clientIp;
      
      const result = await smsService.sendVerificationCode(phone, ip);
      success(res, result, '验证码已发送');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 短信注册
   * POST /api/auth/sms/register
   */
  async register(req, res, next) {
    try {
      const { phone, code, ...userData } = req.body;
      const result = await smsService.registerByPhone(phone, code, userData);
      success(res, result, '注册成功', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 短信登录
   * POST /api/auth/sms/login
   */
  async login(req, res, next) {
    const ip = req.clientIp;
    const userAgent = req.get('user-agent');

    try {
      const { phone, code } = req.body;
      const result = await smsService.loginByPhone(phone, code);

      // 记录登录日志
      loginLogger.info(
        JSON.stringify({
          user: result.user.id,
          username: result.user.username,
          action: 'sms_login',
          status: 'success',
          ip,
          userAgent,
          message: '短信验证码登录成功',
          timestamp: new Date().toISOString(),
        })
      );

      success(res, result, '登录成功');
    } catch (error) {
      // 记录失败日志
      loginLogger.info(
        JSON.stringify({
          user: null,
          username: req.body.phone || 'unknown',
          action: 'sms_login',
          status: 'failed',
          ip,
          userAgent,
          message: error.message || '短信验证码登录失败',
          timestamp: new Date().toISOString(),
        })
      );

      next(error);
    }
  }
}

module.exports = new SMSController();
