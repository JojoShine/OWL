const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const smsRoutes = require('./sms.routes');
const { authenticate } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const authValidation = require('./auth.validation');

/**
 * @route POST /api/auth/register
 * @desc 用户注册
 * @access Public
 */
router.post(
  '/register',
  validate(authValidation.register),
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post(
  '/login',
  validate(authValidation.login),
  authController.login
);

/**
 * @route GET /api/auth/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route POST /api/auth/change-password
 * @desc 修改密码
 * @access Private
 */
router.post(
  '/change-password',
  authenticate,
  validate(authValidation.changePassword),
  authController.changePassword
);

/**
 * @route POST /api/auth/refresh-token
 * @desc 刷新Token
 * @access Private
 */
router.post(
  '/refresh-token',
  authenticate,
  authController.refreshToken
);

/**
 * @route POST /api/auth/logout
 * @desc 登出
 * @access Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

// SMS认证路由
router.use('/sms', smsRoutes);

module.exports = router;
