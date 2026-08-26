const express = require('express');
const router = express.Router();

/**
 * 公开API路由
 * 这些接口可以被外部系统访问，通过 /api/public 前缀
 * 在 nginx 中配置 /owl/api/public 允许外部访问
 */

// 验证码接口（公开，无需认证）
const captchaRoutes = require('../core/modules/captcha/captcha.routes');
const integrationRoutes = require('./integration.routes');

router.use('/captcha', captchaRoutes);
router.use('/integration', integrationRoutes);

module.exports = router;
