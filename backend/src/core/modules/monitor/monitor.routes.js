const express = require('express');
const router = express.Router();
const monitorController = require('./monitor.controller');
const apiMonitorController = require('./api-monitor.controller');
const alertController = require('./alert.controller');
const serverMonitorController = require('./server-monitor.controller');
const { authenticate } = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');

// 公开路由：获取系统服务状态（不需要认证，用于登录页面）
router.get('/status', monitorController.getSystemStatus);

// 所有其他监控路由都需要认证
router.use(authenticate);

// 获取系统性能指标
router.get('/system', checkPermission('monitor', 'read'), monitorController.getSystemMetrics);

// 获取应用指标
router.get('/application', checkPermission('monitor', 'read'), monitorController.getApplicationMetrics);

// 获取数据库指标
router.get('/database', checkPermission('monitor', 'read'), monitorController.getDatabaseMetrics);

// 获取缓存指标
router.get('/cache', checkPermission('monitor', 'read'), monitorController.getCacheMetrics);

// 获取所有指标（综合）
router.get('/all', checkPermission('monitor', 'read'), monitorController.getAllMetrics);

// ========== 接口监控路由 ==========

// 获取所有监控配置列表
router.get('/apis', checkPermission('monitor', 'read'), apiMonitorController.getAllMonitors);

// 创建监控配置
router.post('/apis', checkPermission('monitor', 'create'), apiMonitorController.createMonitor);

// 根据 ID 获取监控配置
router.get('/apis/:id', checkPermission('monitor', 'read'), apiMonitorController.getMonitorById);

// 更新监控配置
router.put('/apis/:id', checkPermission('monitor', 'update'), apiMonitorController.updateMonitor);

// 删除监控配置
router.delete('/apis/:id', checkPermission('monitor', 'delete'), apiMonitorController.deleteMonitor);

// 立即测试接口
router.post('/apis/:id/test', checkPermission('monitor', 'create'), apiMonitorController.testApi);

// 获取监控日志
router.get('/apis/:id/logs', checkPermission('monitor', 'read'), apiMonitorController.getMonitorLogs);

// 获取监控统计信息
router.get('/apis/:id/stats', checkPermission('monitor', 'read'), apiMonitorController.getMonitorStats);

// ========== 告警管理路由 ==========

// 获取所有告警规则
router.get('/alerts/rules', checkPermission('monitor', 'read'), alertController.getAllRules);

// 创建告警规则
router.post('/alerts/rules', checkPermission('monitor', 'create'), alertController.createRule);

// 根据 ID 获取告警规则
router.get('/alerts/rules/:id', checkPermission('monitor', 'read'), alertController.getRuleById);

// 更新告警规则
router.put('/alerts/rules/:id', checkPermission('monitor', 'update'), alertController.updateRule);

// 删除告警规则
router.delete('/alerts/rules/:id', checkPermission('monitor', 'delete'), alertController.deleteRule);

// 获取告警历史
router.get('/alerts/history', checkPermission('monitor', 'read'), alertController.getAlertHistory);

// 标记告警为已解决
router.put('/alerts/history/:id/resolve', checkPermission('monitor', 'update'), alertController.resolveAlert);

// 获取告警统计
router.get('/alerts/stats', checkPermission('monitor', 'read'), alertController.getAlertStats);

// 手动触发告警检查
router.post('/alerts/check', checkPermission('monitor', 'create'), alertController.triggerCheck);

// ========== 服务器监控路由 ==========

// 获取所有服务器列表
router.get('/servers', checkPermission('monitor', 'read'), serverMonitorController.getAllServers);

// 创建服务器监控配置
router.post('/servers', checkPermission('monitor', 'create'), serverMonitorController.createServer);

// 根据 ID 获取服务器详情
router.get('/servers/:id', checkPermission('monitor', 'read'), serverMonitorController.getServerById);

// 更新服务器监控配置
router.put('/servers/:id', checkPermission('monitor', 'update'), serverMonitorController.updateServer);

// 删除服务器监控配置
router.delete('/servers/:id', checkPermission('monitor', 'delete'), serverMonitorController.deleteServer);

// 测试服务器连接（SSH）
router.post('/servers/:id/test', checkPermission('monitor', 'create'), serverMonitorController.testConnection);

// 手动触发检查（采集指标）
router.post('/servers/:id/check', checkPermission('monitor', 'create'), serverMonitorController.triggerCheck);

// 获取服务器监控日志
router.get('/servers/:id/logs', checkPermission('monitor', 'read'), serverMonitorController.getServerLogs);

// 启动/停止服务器监控
router.post('/servers/:id/toggle', checkPermission('monitor', 'update'), serverMonitorController.toggleMonitoring);

// 添加服务端口
router.post('/servers/:id/ports', checkPermission('monitor', 'create'), serverMonitorController.addPort);

// 更新服务端口
router.put('/ports/:portId', checkPermission('monitor', 'update'), serverMonitorController.updatePort);

// 删除服务端口
router.delete('/ports/:portId', checkPermission('monitor', 'delete'), serverMonitorController.deletePort);

module.exports = router;
