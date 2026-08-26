const dbReaderService = require('./db-reader.service');
const moduleConfigService = require('./module-config.service');
const codeGeneratorService = require('./code-generator.service');
const generationHistoryService = require('./generation-history.service');
const sqlParserService = require('./sql-parser.service');
const businessTableService = require('./business-table.service');
const { success, paginated } = require('../../../utils/response');

class GeneratorController {
  /**
   * 创建业务表并初始化生成配置
   * POST /api/generator/business-tables
   */
  async createBusinessTable(req, res, next) {
    try {
      const result = await businessTableService.createBusinessTable(req.body, req.user.id);
      success(res, result, '业务表创建成功，生成配置已初始化', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取数据库表列表
   * GET /api/generator/tables
   */
  async getTables(req, res, next) {
    try {
      const result = await dbReaderService.getTables(req.query);
      paginated(res, result.data, result.pagination, '获取表列表成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取表结构详情
   * GET /api/generator/tables/:tableName
   */
  async getTableStructure(req, res, next) {
    try {
      const { tableName } = req.params;
      const structure = await dbReaderService.getTableStructure(tableName);
      success(res, structure, '获取表结构成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取模块配置列表
   * GET /api/generator/configs
   */
  async getModuleConfigs(req, res, next) {
    try {
      const result = await moduleConfigService.getModuleConfigs(req.query);
      paginated(res, result.data, result.pagination, '获取模块配置列表成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取模块配置详情
   * GET /api/generator/configs/:id
   */
  async getModuleConfigById(req, res, next) {
    try {
      const config = await moduleConfigService.getModuleConfigById(req.params.id);
      success(res, config, '获取模块配置成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 初始化模块配置（从表结构自动生成）
   * POST /api/generator/configs/initialize
   */
  async initializeModuleConfig(req, res, next) {
    try {
      const { tableName } = req.body;
      const config = await moduleConfigService.initializeModuleConfig(tableName);
      success(res, config, '模块配置初始化成功', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 保存模块配置
   * POST /api/generator/configs
   * PUT /api/generator/configs/:id
   */
  async saveModuleConfig(req, res, next) {
    try {
      const data = req.params.id
        ? { id: req.params.id, ...req.body }
        : req.body;

      const config = await moduleConfigService.saveModuleConfig(data);
      const message = req.params.id ? '模块配置更新成功' : '模块配置创建成功';
      const statusCode = req.params.id ? 200 : 201;

      success(res, config, message, statusCode);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除模块配置
   * DELETE /api/generator/configs/:id
   */
  async deleteModuleConfig(req, res, next) {
    try {
      const result = await moduleConfigService.deleteModuleConfig(req.params.id);
      success(res, result, '模块配置删除成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 生成代码
   * POST /api/generator/generate/:moduleId
   */
  async generateCode(req, res, next) {
    let moduleConfig = null;

    try {
      const { moduleId } = req.params;
      const options = req.body;

      // 获取模块配置
      moduleConfig = await moduleConfigService.getModuleConfigById(moduleId);

      // 生成代码
      const result = await codeGeneratorService.generateCode(moduleId, options);

      // 记录历史
      await generationHistoryService.recordHistory({
        module_id: moduleId,
        table_name: moduleConfig.table_name,
        module_name: moduleConfig.module_name,
        operation_type: 'create',
        files_generated: result.files,
        success: true,
        user_id: req.user?.id,
      });

      success(res, result, '代码生成成功', 201);
    } catch (error) {
      // 记录失败历史
      try {
        await generationHistoryService.recordHistory({
          module_id: req.params.moduleId,
          table_name: moduleConfig?.table_name,
          module_name: moduleConfig?.module_name,
          operation_type: 'create',
          files_generated: [],
          success: false,
          error_message: error.message,
          user_id: req.user?.id,
        });
      } catch (historyError) {
        // 忽略历史记录错误
      }

      next(error);
    }
  }

  /**
   * 删除生成的代码
   * DELETE /api/generator/generate/:moduleId
   */
  async deleteGeneratedCode(req, res, next) {
    try {
      const { moduleId } = req.params;

      // 获取模块配置
      const moduleConfig = await moduleConfigService.getModuleConfigById(moduleId);

      const result = await codeGeneratorService.deleteGeneratedCode(moduleId);

      // 记录历史
      await generationHistoryService.recordHistory({
        module_id: moduleId,
        table_name: moduleConfig.table_name,
        module_name: moduleConfig.module_name,
        operation_type: 'delete',
        files_generated: [],
        success: true,
        user_id: req.user?.id,
      });

      success(res, result, '生成的代码已删除');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取生成历史列表
   * GET /api/generator/history
   */
  async getHistoryList(req, res, next) {
    try {
      const result = await generationHistoryService.getHistoryList(req.query);
      paginated(res, result.data, result.pagination, '获取生成历史列表成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取生成历史详情
   * GET /api/generator/history/:id
   */
  async getHistoryById(req, res, next) {
    try {
      const history = await generationHistoryService.getHistoryById(req.params.id);
      success(res, history, '获取生成历史详情成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取模块的生成历史（分页）
   * GET /api/generator/configs/:moduleId/history
   */
  async getModuleHistory(req, res, next) {
    try {
      const { moduleId } = req.params;
      const result = await generationHistoryService.getModuleHistory(moduleId, req.query);
      paginated(res, result.data, result.pagination, '获取模块生成历史成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取生成统计信息
   * GET /api/generator/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await generationHistoryService.getStatistics(req.query);
      success(res, stats, '获取统计信息成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 清理旧的历史记录
   * DELETE /api/generator/history/cleanup
   */
  async cleanupHistory(req, res, next) {
    try {
      const { daysToKeep = 30 } = req.body;
      const result = await generationHistoryService.cleanupOldHistory(daysToKeep);
      success(res, result, '历史记录清理成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 根据模块路径获取页面配置（用于动态路由）
   * GET /api/generator/page-config/:modulePath
   */
  async getPageConfigByPath(req, res, next) {
    try {
      const { modulePath } = req.params;
      const moduleConfig = await moduleConfigService.getModuleConfigByPath(modulePath);

      // 如果已有 page_config，直接返回；否则动态构建
      let pageConfig = moduleConfig.page_config;

      if (!pageConfig) {
        const configBuilderService = require('./config-builder.service');
        pageConfig = configBuilderService.buildPageConfig(
          moduleConfig,
          moduleConfig.fields || []
        );
      }

      success(res, pageConfig, '获取页面配置成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取完整的页面配置
   * GET /api/generator/configs/:id/page-config
   */
  async getFullPageConfig(req, res, next) {
    try {
      const { id } = req.params;
      const pageConfig = await moduleConfigService.getFullPageConfig(id);
      success(res, pageConfig, '获取页面配置成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新页面配置
   * PUT /api/generator/configs/:id/page-config
   */
  async updatePageConfig(req, res, next) {
    try {
      const { id } = req.params;
      const { pageConfig } = req.body;
      const result = await moduleConfigService.updatePageConfig(id, pageConfig);
      success(res, result, '更新页面配置成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 验证SQL语法
   * POST /api/generator/validate-sql
   */
  async validateSql(req, res, next) {
    try {
      const { sql } = req.body;
      const result = await sqlParserService.validateSql(sql);
      success(res, result, result.valid ? 'SQL语法验证通过' : 'SQL语法验证失败');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 预览SQL查询结果
   * POST /api/generator/preview-sql
   */
  async previewSql(req, res, next) {
    try {
      const { sql, limit = 10 } = req.body;
      const result = await sqlParserService.executeSampleQuery(sql, limit);
      success(res, result, 'SQL查询预览成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 从SQL生成字段配置
   * POST /api/generator/generate-fields-from-sql
   */
  async generateFieldsFromSql(req, res, next) {
    try {
      const { sql } = req.body;
      const fields = await sqlParserService.parseSqlFields(sql);
      success(res, fields, '字段配置生成成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 检查表审计字段缺失情况
   * GET /api/generator/tables/:tableName/audit-check
   */
  async checkAuditFields(req, res, next) {
    try {
      const { tableName } = req.params;
      const result = await codeGeneratorService.checkAuditFields(tableName);
      success(res, result, '审计字段检查完成');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 一键补全表审计字段
   * POST /api/generator/tables/:tableName/add-audit-fields
   */
  async addAuditFields(req, res, next) {
    try {
      const { tableName } = req.params;
      const result = await codeGeneratorService.addAuditFields(tableName);
      success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GeneratorController();
