const { logger } = require('../config/logger');
const ApiError = require('../utils/ApiError');
const db = require('../models');
const jwtUtil = require('../utils/jwt.util');
const { authenticatedUserCache } = require('./auth-user-cache');

const loadAuthenticatedUser = (userId) => authenticatedUserCache.get(userId, () => (
  db.User.findByPk(userId, {
    include: [
      {
        model: db.Role,
        as: 'roles',
        through: { attributes: [] },
      },
      {
        model: db.Department,
        as: 'department',
        attributes: ['id', 'name'],
      },
    ],
  })
));

/**
 * JWT认证中间件
 * 验证token并从数据库加载完整用户信息（包括角色）
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw ApiError.unauthorized('未提供认证token');
    }

    // 验证token
    const decoded = jwtUtil.verifyToken(token);

    // 从数据库加载完整用户信息和角色
    const user = await loadAuthenticatedUser(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('用户不存在');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw ApiError.forbidden(`用户状态异常: ${user.status}`);
    }

    // 将用户信息附加到请求对象
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.error('Token verification failed:', error);
      return next(ApiError.unauthorized('Token无效'));
    } else if (error.name === 'TokenExpiredError') {
      logger.error('Token expired:', error);
      return next(ApiError.unauthorized('Token已过期'));
    }
    next(error);
  }
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，但不强制要求token
 * 用于某些可以公开访问但登录后有额外功能的接口
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // 没有token，继续但不设置req.user
      return next();
    }

    // 有token，执行完整认证流程
    const decoded = jwtUtil.verifyToken(token);

    const user = await loadAuthenticatedUser(decoded.id);

    if (user && user.status === 'active') {
      req.user = user;
    }

    next();
  } catch (error) {
    // token无效时不抛出错误，继续执行
    logger.warn('Optional auth failed:', error.message);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  invalidateAuthenticatedUser: (userId) => authenticatedUserCache.invalidate(userId),
  clearAuthenticatedUsers: () => authenticatedUserCache.clear(),
};
