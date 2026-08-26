const authService = require('./auth.service');
const { success } = require('../../../utils/response');
const { loginLogger } = require('../../../config/logger');
const { parseUserAgent } = require('../../../utils/user-agent-parser');

class AuthController {
  /**
   * 用户注册
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      success(res, user, '注册成功', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 用户登录
   * POST /api/auth/login
   */
  async login(req, res, next) {
    const ip = req.clientIp;
    const userAgent = req.get('user-agent') || '';
    const { username } = req.body;

    try {
      // 解析设备信息
      const deviceInfo = parseUserAgent(userAgent);

      // 调用认证服务并传递设备信息和IP
      const result = await authService.login(req.body, deviceInfo, ip);

      // 记录登录成功日志
      loginLogger.info(
        JSON.stringify({
          user: result.user.id,
          username: result.user.username,
          action: 'login',
          status: 'success',
          ip,
          userAgent,
          device: deviceInfo.device_name,
          message: '登录成功',
          timestamp: new Date().toISOString(),
        })
      );

      success(res, result, '登录成功');
    } catch (error) {
      // 记录登录失败日志
      loginLogger.info(
        JSON.stringify({
          user: null,
          username: username || 'unknown',
          action: 'login',
          status: 'failure',
          ip,
          userAgent,
          message: error.message || '登录失败',
          timestamp: new Date().toISOString(),
        })
      );

      next(error);
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      success(res, user, '获取用户信息成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 修改密码
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const result = await authService.changePassword(req.user.id, req.body);
      success(res, result, '密码修改成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刷新Token
   * POST /api/auth/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const result = await authService.refreshToken(req.user.id);
      success(res, result, 'Token刷新成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 登出
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    const ip = req.clientIp;
    const userAgent = req.get('user-agent');

    try {
      // 记录登出日志
      loginLogger.info(
        JSON.stringify({
          user: req.user?.id || null,
          username: req.user?.username || 'unknown',
          action: 'logout',
          status: 'success',
          ip,
          userAgent,
          message: '登出成功',
          timestamp: new Date().toISOString(),
        })
      );

      // 这里可以将token加入黑名单（Redis）
      // 目前简单返回成功
      success(res, null, '登出成功');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
