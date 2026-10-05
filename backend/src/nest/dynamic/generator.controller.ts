import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { DbReaderService } from './db-reader.service';
import { ModuleConfigService } from './module-config.service';
import { CodeGeneratorService } from './code-generator.service';
import { GenerationHistoryService } from './generation-history.service';
import { SqlParserService } from './sql-parser.service';
import { BusinessTableService } from './business-table.service';
const { success, paginated } = shared('utils/response');
@Controller('api/system/generator')
@UseGuards(IdentityGuard)
export class GeneratorController {
    constructor(private readonly dbReaderService: DbReaderService, private readonly moduleConfigService: ModuleConfigService, private readonly codeGeneratorService: CodeGeneratorService, private readonly generationHistoryService: GenerationHistoryService, private readonly sqlParserService: SqlParserService, private readonly businessTableService: BusinessTableService) { }
    @Post('business-tables')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "create"], "validation": ["generator", "createBusinessTable"] })
    async createBusinessTable(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.businessTableService.createBusinessTable(req.body, req.user.id);
            success(res, result, '业务表创建成功，生成配置已初始化', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('tables')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "getTables"] })
    async getTables(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.dbReaderService.getTables(req.query);
            paginated(res, result.data, result.pagination, '获取表列表成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('tables/:tableName')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "getTableStructure"] })
    async getTableStructure(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { tableName } = req.params;
            const structure = await this.dbReaderService.getTableStructure(tableName);
            success(res, structure, '获取表结构成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('configs')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "getModuleConfigs"] })
    async getModuleConfigs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.moduleConfigService.getModuleConfigs(req.query);
            paginated(res, result.data, result.pagination, '获取模块配置列表成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('configs/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "getModuleConfigById"] })
    async getModuleConfigById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const config = await this.moduleConfigService.getModuleConfigById(req.params.id);
            success(res, config, '获取模块配置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('configs/initialize')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "create"], "validation": ["generator", "initializeModuleConfig"] })
    async initializeModuleConfig(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { tableName } = req.body;
            const config = await this.moduleConfigService.initializeModuleConfig(tableName);
            success(res, config, '模块配置初始化成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('configs')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "create"], "validation": ["generator", "saveModuleConfig"] })
    async saveModuleConfig(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const data = req.params.id
                ? { ...req.body, id: req.params.id }
                : req.body;
            const config = await this.moduleConfigService.saveModuleConfig(data);
            const message = req.params.id ? '模块配置更新成功' : '模块配置创建成功';
            const statusCode = req.params.id ? 200 : 201;
            success(res, config, message, statusCode);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete('configs/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "delete"], "validation": ["generator", "deleteModuleConfig"] })
    async deleteModuleConfig(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.moduleConfigService.deleteModuleConfig(req.params.id);
            success(res, result, '模块配置删除成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('generate/:moduleId')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "create"], "validation": ["generator", "generateCode"] })
    async generateCode(
    @Req()
    req: any,
    @Res()
    res: Response) {
        let moduleConfig = null;
        try {
            const { moduleId } = req.params;
            const options = req.body;
            // 获取模块配置
            moduleConfig = await this.moduleConfigService.getModuleConfigById(moduleId);
            // 生成代码
            const result = await this.codeGeneratorService.generateCode(moduleId, options);
            // 记录历史
            await this.generationHistoryService.recordHistory({
                module_id: moduleId,
                table_name: moduleConfig.table_name,
                module_name: moduleConfig.module_name,
                operation_type: 'create',
                files_generated: [],
                success: true,
                user_id: req.user?.id,
            });
            success(res, result, '代码生成成功', 201);
        }
        catch (error: any) {
            // 记录失败历史
            try {
                await this.generationHistoryService.recordHistory({
                    module_id: req.params.moduleId,
                    table_name: moduleConfig?.table_name,
                    module_name: moduleConfig?.module_name,
                    operation_type: 'create',
                    files_generated: [],
                    success: false,
                    error_message: error.message,
                    user_id: req.user?.id,
                });
            }
            catch (historyError) {
                // 忽略历史记录错误
            }
            throw error;
        }
    }
    @Delete('generate/:moduleId')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "delete"], "validation": ["generator", "deleteGeneratedCode"] })
    async deleteGeneratedCode(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { moduleId } = req.params;
            // 获取模块配置
            const moduleConfig = await this.moduleConfigService.getModuleConfigById(moduleId);
            const result = await this.codeGeneratorService.deleteGeneratedCode(moduleId);
            // 记录历史
            await this.generationHistoryService.recordHistory({
                module_id: moduleId,
                table_name: moduleConfig.table_name,
                module_name: moduleConfig.module_name,
                operation_type: 'delete',
                files_generated: [],
                success: true,
                user_id: req.user?.id,
            });
            success(res, result, '生成的代码已删除');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('history')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "getHistoryList"] })
    async getHistoryList(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.generationHistoryService.getHistoryList(req.query);
            paginated(res, result.data, result.pagination, '获取生成历史列表成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('history/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "getHistoryById"] })
    async getHistoryById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const history = await this.generationHistoryService.getHistoryById(req.params.id);
            success(res, history, '获取生成历史详情成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('configs/:moduleId/history')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "getModuleHistory"] })
    async getModuleHistory(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { moduleId } = req.params;
            const result = await this.generationHistoryService.getModuleHistory(moduleId, req.query);
            paginated(res, result.data, result.pagination, '获取模块生成历史成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('statistics')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "getStatistics"] })
    async getStatistics(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const stats = await this.generationHistoryService.getStatistics(req.query);
            success(res, stats, '获取统计信息成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete('history/cleanup')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "delete"], "validation": ["generator", "cleanupHistory"] })
    async cleanupHistory(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { daysToKeep = 30 } = req.body;
            const result = await this.generationHistoryService.cleanupOldHistory(daysToKeep);
            success(res, result, '历史记录清理成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('page-config/:modulePath')
    @HttpCode(200)
    @IdentityRoute({})
    async getPageConfigByPath(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { modulePath } = req.params;
            const moduleConfig = await this.moduleConfigService.getModuleConfigByPath(modulePath);
            // 如果已有 page_config，直接返回；否则动态构建
            let pageConfig = moduleConfig.page_config;
            if (!pageConfig) {
                const configBuilderService = shared('generator/config-builder');
                pageConfig = configBuilderService.buildPageConfig(moduleConfig, moduleConfig.fields || []);
            }
            success(res, pageConfig, '获取页面配置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('configs/:id/page-config')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"] })
    async getFullPageConfig(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const pageConfig = await this.moduleConfigService.getFullPageConfig(id);
            success(res, pageConfig, '获取页面配置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put('configs/:id/page-config')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "update"] })
    async updatePageConfig(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const { pageConfig } = req.body;
            const result = await this.moduleConfigService.updatePageConfig(id, pageConfig);
            success(res, result, '更新页面配置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('validate-sql')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "validateSql"] })
    async validateSql(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { sql } = req.body;
            const result = await this.sqlParserService.validateSql(sql);
            success(res, result, result.valid ? 'SQL语法验证通过' : 'SQL语法验证失败');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('preview-sql')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "previewSql"] })
    async previewSql(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { sql, limit = 10 } = req.body;
            const result = await this.sqlParserService.executeSampleQuery(sql, limit);
            success(res, result, 'SQL查询预览成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('generate-fields-from-sql')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "create"], "validation": ["generator", "generateFieldsFromSql"] })
    async generateFieldsFromSql(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { sql } = req.body;
            const fields = await this.sqlParserService.parseSqlFields(sql);
            success(res, fields, '字段配置生成成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('tables/:tableName/audit-check')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "read"], "validation": ["generator", "checkAuditFields"] })
    async checkAuditFields(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { tableName } = req.params;
            const result = await this.codeGeneratorService.checkAuditFields(tableName);
            success(res, result, '审计字段检查完成');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('tables/:tableName/add-audit-fields')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "create"], "validation": ["generator", "addAuditFields"] })
    async addAuditFields(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { tableName } = req.params;
            const result = await this.codeGeneratorService.addAuditFields(tableName);
            success(res, result, result.message);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put('configs/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["generator", "update"], "validation": ["generator", "updateModuleConfig"] })
    async saveModuleConfigAlternate(
    @Req()
    req: any,
    @Res()
    res: Response) { return this.saveModuleConfig(req, res); }
}
