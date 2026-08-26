const express = require('express');
const router = express.Router();
const executorController = require('./api-builder-executor.controller');
const apiKeyService = require('./api-key.service');
const { authenticate } = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');

/**
 * 动态API鉴权中间件
 * 验证API密钥（如果接口需要的话）
 */
const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.get('X-API-Key');
    if (apiKey) req.sqlApiKey = await apiKeyService.authenticate(apiKey);
    next();
  } catch (error) {
    next(error);
  }
};

// 应用API密钥中间件
router.use(apiKeyMiddleware);

/**
 * 测试接口
 * POST /test/:id
 * 需要登录用户
 */
router.post(
  '/test/:id',
  authenticate,
  checkPermission('api-interface', 'read'),
  (req, res) => executorController.testInterface(req, res)
);

// 导出标准 router
module.exports = router;

/**
 * 获取动态API路由（用于在主路由中注册）
 * 这些路由需要在主路由文件中单独处理
 */
const getCustomRoutes = () => {
  const customRouter = express.Router();

  customRouter.use(apiKeyMiddleware);

  customRouter.get(
    '/custom/*',
    (req, res) => executorController.executeCustomApi(req, res)
  );

  customRouter.post(
    '/custom/*',
    (req, res) => executorController.executeCustomApi(req, res)
  );

  customRouter.put(
    '/custom/*',
    (req, res) => executorController.executeCustomApi(req, res)
  );

  customRouter.delete(
    '/custom/*',
    (req, res) => executorController.executeCustomApi(req, res)
  );

  return customRouter;
};

// 导出自定义路由生成函数（供 routes/index.js 使用）
module.exports.getCustomRoutes = getCustomRoutes;
