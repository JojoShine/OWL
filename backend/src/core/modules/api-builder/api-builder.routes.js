const express = require('express');
const router = express.Router();
const controller = require('./api-builder.controller');
const {
  createInterfaceRules,
  updateInterfaceRules,
  listInterfaceRules,
  handleValidationErrors,
} = require('./api-builder.validation');
const { authenticate } = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');

// 接口管理API
router.post(
  '/',
  authenticate,
  checkPermission('api-interface', 'create'),
  createInterfaceRules(),
  handleValidationErrors,
  (req, res) => controller.createInterface(req, res)
);

router.get(
  '/',
  authenticate,
  checkPermission('api-interface', 'read'),
  listInterfaceRules(),
  handleValidationErrors,
  (req, res) => controller.getInterfaces(req, res)
);

router.get(
  '/:id',
  authenticate,
  checkPermission('api-interface', 'read'),
  (req, res) => controller.getInterface(req, res)
);

router.put(
  '/:id',
  authenticate,
  checkPermission('api-interface', 'update'),
  updateInterfaceRules(),
  handleValidationErrors,
  (req, res) => controller.updateInterface(req, res)
);

router.delete(
  '/:id',
  authenticate,
  checkPermission('api-interface', 'delete'),
  (req, res) => controller.deleteInterface(req, res)
);

// SQL查询相关API（这两个路由需要在其他路由前面，防止被 /:id 路由匹配）
router.post(
  '/test-sql',
  authenticate,
  checkPermission('api-interface', 'read'),
  (req, res, next) => controller.testSql(req, res, next)
);

router.post(
  '/execute-sql',
  authenticate,
  checkPermission('api-interface', 'read'),
  (req, res, next) => controller.executeSql(req, res, next)
);

module.exports = router;
