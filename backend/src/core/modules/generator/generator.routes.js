const express = require('express');
const router = express.Router();
const generatorController = require('./generator.controller');
const { authenticate } = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');
const validate = require('../../../middlewares/validate');
const generatorValidation = require('./generator.validation');

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/generator/tables
 * @desc    获取数据库表列表
 * @access  Private
 */
router.get(
  '/tables',
  checkPermission('generator', 'read'),
  validate(generatorValidation.getTables),
  generatorController.getTables
);

/**
 * @route   POST /api/generator/business-tables
 * @desc    创建新的业务表并初始化生成配置
 * @access  Private
 */
router.post(
  '/business-tables',
  checkPermission('generator', 'create'),
  validate(generatorValidation.createBusinessTable),
  generatorController.createBusinessTable
);

/**
 * @route   GET /api/generator/tables/:tableName
 * @desc    获取表结构详情
 * @access  Private
 */
router.get(
  '/tables/:tableName',
  checkPermission('generator', 'read'),
  validate(generatorValidation.getTableStructure),
  generatorController.getTableStructure
);

/**
 * @route   GET /api/generator/configs
 * @desc    获取模块配置列表
 * @access  Private
 */
router.get(
  '/configs',
  checkPermission('generator', 'read'),
  validate(generatorValidation.getModuleConfigs),
  generatorController.getModuleConfigs
);

/**
 * @route   GET /api/generator/configs/:id
 * @desc    获取模块配置详情
 * @access  Private
 */
router.get(
  '/configs/:id',
  checkPermission('generator', 'read'),
  validate(generatorValidation.getModuleConfigById),
  generatorController.getModuleConfigById
);

/**
 * @route   POST /api/generator/configs/initialize
 * @desc    初始化模块配置（从表结构自动生成）
 * @access  Private
 */
router.post(
  '/configs/initialize',
  checkPermission('generator', 'create'),
  validate(generatorValidation.initializeModuleConfig),
  generatorController.initializeModuleConfig
);

/**
 * @route   POST /api/generator/configs
 * @desc    创建模块配置
 * @access  Private
 */
router.post(
  '/configs',
  checkPermission('generator', 'create'),
  validate(generatorValidation.saveModuleConfig),
  generatorController.saveModuleConfig
);

/**
 * @route   PUT /api/generator/configs/:id
 * @desc    更新模块配置
 * @access  Private
 */
router.put(
  '/configs/:id',
  checkPermission('generator', 'update'),
  validate(generatorValidation.updateModuleConfig),
  generatorController.saveModuleConfig
);

/**
 * @route   DELETE /api/generator/configs/:id
 * @desc    删除模块配置
 * @access  Private
 */
router.delete(
  '/configs/:id',
  checkPermission('generator', 'delete'),
  validate(generatorValidation.deleteModuleConfig),
  generatorController.deleteModuleConfig
);

/**
 * @route   POST /api/generator/generate/:moduleId
 * @desc    生成代码
 * @access  Private
 */
router.post(
  '/generate/:moduleId',
  checkPermission('generator', 'create'),
  validate(generatorValidation.generateCode),
  generatorController.generateCode
);

/**
 * @route   DELETE /api/generator/generate/:moduleId
 * @desc    删除生成的代码
 * @access  Private
 */
router.delete(
  '/generate/:moduleId',
  checkPermission('generator', 'delete'),
  validate(generatorValidation.deleteGeneratedCode),
  generatorController.deleteGeneratedCode
);

/**
 * @route   GET /api/generator/history
 * @desc    获取生成历史列表
 * @access  Private
 */
router.get(
  '/history',
  checkPermission('generator', 'read'),
  validate(generatorValidation.getHistoryList),
  generatorController.getHistoryList
);

/**
 * @route   GET /api/generator/history/:id
 * @desc    获取生成历史详情
 * @access  Private
 */
router.get(
  '/history/:id',
  checkPermission('generator', 'read'),
  validate(generatorValidation.getHistoryById),
  generatorController.getHistoryById
);

/**
 * @route   GET /api/generator/configs/:moduleId/history
 * @desc    获取模块的生成历史
 * @access  Private
 */
router.get(
  '/configs/:moduleId/history',
  checkPermission('generator', 'read'),
  validate(generatorValidation.getModuleHistory),
  generatorController.getModuleHistory
);

/**
 * @route   GET /api/generator/statistics
 * @desc    获取生成统计信息
 * @access  Private
 */
router.get(
  '/statistics',
  checkPermission('generator', 'read'),
  validate(generatorValidation.getStatistics),
  generatorController.getStatistics
);

/**
 * @route   DELETE /api/generator/history/cleanup
 * @desc    清理旧的历史记录
 * @access  Private
 */
router.delete(
  '/history/cleanup',
  checkPermission('generator', 'delete'),
  validate(generatorValidation.cleanupHistory),
  generatorController.cleanupHistory
);

/**
 * @route   GET /api/generator/page-config/:modulePath
 * @desc    根据模块路径获取页面配置（用于动态路由）
 * @access  Private
 */
router.get(
  '/page-config/:modulePath',
  generatorController.getPageConfigByPath
);

/**
 * @route   GET /api/generator/configs/:id/page-config
 * @desc    获取完整的页面配置
 * @access  Private
 */
router.get(
  '/configs/:id/page-config',
  checkPermission('generator', 'read'),
  generatorController.getFullPageConfig
);

/**
 * @route   PUT /api/generator/configs/:id/page-config
 * @desc    更新页面配置
 * @access  Private
 */
router.put(
  '/configs/:id/page-config',
  checkPermission('generator', 'update'),
  generatorController.updatePageConfig
);

/**
 * @route   POST /api/generator/validate-sql
 * @desc    验证SQL语法
 * @access  Private
 */
router.post(
  '/validate-sql',
  checkPermission('generator', 'read'),
  validate(generatorValidation.validateSql),
  generatorController.validateSql
);

/**
 * @route   POST /api/generator/preview-sql
 * @desc    预览SQL查询结果
 * @access  Private
 */
router.post(
  '/preview-sql',
  checkPermission('generator', 'read'),
  validate(generatorValidation.previewSql),
  generatorController.previewSql
);

/**
 * @route   POST /api/generator/generate-fields-from-sql
 * @desc    从SQL生成字段配置
 * @access  Private
 */
router.post(
  '/generate-fields-from-sql',
  checkPermission('generator', 'create'),
  validate(generatorValidation.generateFieldsFromSql),
  generatorController.generateFieldsFromSql
);

/**
 * @route   GET /api/generator/tables/:tableName/audit-check
 * @desc    检查表审计字段缺失情况
 * @access  Private
 */
router.get(
  '/tables/:tableName/audit-check',
  checkPermission('generator', 'read'),
  validate(generatorValidation.checkAuditFields),
  generatorController.checkAuditFields
);

/**
 * @route   POST /api/generator/tables/:tableName/add-audit-fields
 * @desc    一键补全表审计字段
 * @access  Private
 */
router.post(
  '/tables/:tableName/add-audit-fields',
  checkPermission('generator', 'create'),
  validate(generatorValidation.addAuditFields),
  generatorController.addAuditFields
);

module.exports = router;
