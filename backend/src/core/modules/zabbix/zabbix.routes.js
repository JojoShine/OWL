/**
 * Zabbix实例管理路由
 * 模块归属：Zabbix集成模块
 * 使用场景：定义Zabbix实例相关的API端点
 */
const express = require('express');
const router = express.Router();
const controller = require('./zabbix.controller');
const validation = require('./zabbix.validation');
const validate = require('../../../middlewares/validate');
const { authenticate } = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');

// 所有路由都需要认证
router.use(authenticate);

/**
 * GET /api/system/zabbix
 * 获取实例列表
 */
router.get(
  '/',
  checkPermission('zabbix:read'),
  validate(validation.listInstances),
  controller.getList
);

/**
 * GET /api/system/zabbix/:id
 * 获取实例详情
 */
router.get(
  '/:id',
  checkPermission('zabbix:read'),
  validate(validation.instanceId),
  controller.getOne
);

/**
 * POST /api/system/zabbix
 * 创建实例
 */
router.post(
  '/',
  checkPermission('zabbix:create'),
  validate(validation.createInstance),
  controller.create
);

/**
 * PUT /api/system/zabbix/:id
 * 更新实例
 */
router.put(
  '/:id',
  checkPermission('zabbix:update'),
  validate(validation.updateInstance),
  controller.update
);

/**
 * DELETE /api/system/zabbix/:id
 * 删除实例
 */
router.delete(
  '/:id',
  checkPermission('zabbix:delete'),
  validate(validation.instanceId),
  controller.delete
);

/**
 * POST /api/system/zabbix/:id/test
 * 测试连接
 */
router.post(
  '/:id/test',
  checkPermission('zabbix:read'),
  validate(validation.instanceId),
  controller.testConnection
);

/**
 * POST /api/system/zabbix/:id/sync
 * 手动同步
 */
router.post(
  '/:id/sync',
  checkPermission('zabbix:update'),
  validate(validation.instanceId),
  controller.sync
);

/**
 * GET /api/system/zabbix/:id/hosts
 * 获取主机列表
 */
router.get(
  '/:id/hosts',
  checkPermission('zabbix:read'),
  validate(validation.hostList),
  controller.getHosts
);

/**
 * GET /api/system/zabbix/:id/hosts/:hostId
 * 获取主机详情 + 监控项
 */
router.get(
  '/:id/hosts/:hostId',
  checkPermission('zabbix:read'),
  validate(validation.instanceId),
  controller.getHostDetail
);

/**
 * GET /api/system/zabbix/:id/problems
 * 获取问题/告警列表
 */
router.get(
  '/:id/problems',
  checkPermission('zabbix:read'),
  validate(validation.problemList),
  controller.getProblems
);

module.exports = router;
