const express = require('express');
const router = express.Router();
const controller = require('./third-party-keys.controller');
const validation = require('./third-party-keys.validation');
const validate = require('../../../middlewares/validate');
const { authenticate } = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');

// 所有路由都需要认证
router.use(authenticate);

/**
 * GET /api/admin/third-party-keys
 * 获取密钥列表
 */
router.get(
  '/',
  checkPermission('third-party-keys:read'),
  validate(validation.listKeys),
  controller.getList
);

router.get('/scopes', checkPermission('third-party-keys:read'), controller.getScopes);

router.get(
  '/:id',
  checkPermission('third-party-keys:read'),
  validate(validation.keyId),
  controller.getOne
);

/**
 * POST /api/admin/third-party-keys
 * 创建新密钥
 */
router.post(
  '/',
  checkPermission('third-party-keys:create'),
  validate(validation.createKey),
  controller.create
);

/**
 * PUT /api/admin/third-party-keys/:id
 * 更新密钥信息
 */
router.put(
  '/:id',
  checkPermission('third-party-keys:update'),
  validate(validation.updateKey),
  controller.update
);

/**
 * PATCH /api/admin/third-party-keys/:id/status
 * 修改密钥状态
 */
router.patch(
  '/:id/status',
  checkPermission('third-party-keys:update'),
  validate(validation.changeStatus),
  controller.changeStatus
);

/**
 * POST /api/admin/third-party-keys/:id/regenerate
 * 重新生成密钥
 */
router.post(
  '/:id/regenerate',
  checkPermission('third-party-keys:update'),
  validate(validation.keyId),
  controller.regenerate
);

/**
 * DELETE /api/admin/third-party-keys/:id
 * 删除密钥
 */
router.delete(
  '/:id',
  checkPermission('third-party-keys:delete'),
  validate(validation.keyId),
  controller.delete
);

module.exports = router;
