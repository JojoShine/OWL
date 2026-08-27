/**
 * 核心系统路由
 * @category Core
 */

const express = require('express');
const router = express.Router();

// 核心模块路由
const authRoutes = require('../core/modules/auth/auth.routes');
const userRoutes = require('../core/modules/user/user.routes');
const roleRoutes = require('../core/modules/role/role.routes');
const permissionRoutes = require('../core/modules/permission/permission.routes');
const menuRoutes = require('../core/modules/menu/menu.routes');
const departmentRoutes = require('../core/modules/department/department.routes');
const fileRoutes = require('../core/modules/file/file.routes');
const folderRoutes = require('../core/modules/folder/folder.routes');
const fileShareRoutes = require('../core/modules/file-share/file-share.routes');
const logRoutes = require('../core/modules/log/log.routes');
const monitorRoutes = require('../core/modules/monitor/monitor.routes');
const notificationRoutes = require('../core/modules/notification/notification.routes');
const systemConfigRoutes = require('../core/modules/system-config/system-config.routes');
const watermarkRoutes = require('../core/modules/watermark/watermark.routes');
const dictionaryRoutes = require('../core/modules/dictionary/dictionary.routes');
const dashboardRoutes = require('../core/modules/dashboard/dashboard.routes');
const dashboardWidgetRoutes = require('../core/modules/dashboard-widget/dashboard-widget.routes');
const apiBuilderRoutes = require('../core/modules/api-builder/api-builder.routes');
const apiBuilderKeysRoutes = require('../core/modules/api-builder/api-builder-keys.routes');
const apiBuilderExecutorRoutes = require('../core/modules/api-builder/api-builder-executor.routes');
const generatorRoutes = require('../core/modules/generator/generator.routes');
const dataSecurityRoutes = require('../core/modules/data-security/data-security.routes');
const thirdPartyKeysRoutes = require('../core/modules/third_party_keys/third-party-keys.routes');
const emailTaskRoutes = require('../core/modules/notification/email-task.routes');
const uploadRoutes = require('../core/modules/upload/upload.routes');

// 挂载核心路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/menus', menuRoutes);
router.use('/departments', departmentRoutes);
router.use('/upload', uploadRoutes);
router.use('/files', fileRoutes);
router.use('/folders', folderRoutes);
router.use('/file-shares', fileShareRoutes);
router.use('/logs', logRoutes);
router.use('/monitor', monitorRoutes);
router.use('/notifications', notificationRoutes);
router.use('/system-config', systemConfigRoutes);
router.use('/watermark', watermarkRoutes);
router.use('/dictionary', dictionaryRoutes);
router.use('/dashboard-widgets', dashboardWidgetRoutes);
router.use('/dashboard', dashboardRoutes);
// API构建器路由（keys 必须在前面，避免被 /:id 拦截）
router.use('/api-builder', apiBuilderKeysRoutes);
router.use('/api-builder', apiBuilderExecutorRoutes);
router.use('/api-builder', apiBuilderRoutes);
router.use('/generator', generatorRoutes);
router.use('/data-security', dataSecurityRoutes);
router.use('/third-party-keys', thirdPartyKeysRoutes);
router.use('/email-tasks', emailTaskRoutes);

module.exports = router;
