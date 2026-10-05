import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { ApiBuilderService } from './api-builder.service';
const { logger } = shared('config/logger');
const { success, created, paginated } = shared('utils/response');
@Controller('api/system/api-builder')
@UseGuards(IdentityGuard)
export class ApiBuilderController {
    constructor(private readonly apiBuilderService: ApiBuilderService) { }
    @Post('')
    @IdentityRoute({ permission: ['api-interface', 'create'], validation: ['api-builder', 'createInterfaceRules'] })
    async createInterface(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const data = req.body;
            const userId = req.user.id;
            const interface_ = await this.apiBuilderService.createInterface(data, userId);
            created(res, interface_, '接口创建成功');
        }
        catch (error: any) {
            logger.error('Error creating interface:', error);
            throw error;
        }
    }
    @Get('')
    @IdentityRoute({ permission: ['api-interface', 'read'], validation: ['api-builder', 'listInterfaceRules'] })
    async getInterfaces(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.apiBuilderService.getInterfaces(req.query);
            paginated(res, result.items, result.pagination, '获取接口列表成功');
        }
        catch (error: any) {
            logger.error('Error getting interfaces:', error);
            throw error;
        }
    }
    @Get(':id')
    @IdentityRoute({ permission: ['api-interface', 'read'] })
    async getInterface(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const interface_ = await this.apiBuilderService.getInterfaceById(id);
            success(res, interface_, '获取接口详情成功');
        }
        catch (error: any) {
            logger.error('Error getting interface:', error);
            throw error;
        }
    }
    @Put(':id')
    @IdentityRoute({ permission: ['api-interface', 'update'], validation: ['api-builder', 'updateInterfaceRules'] })
    async updateInterface(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;
            const interface_ = await this.apiBuilderService.updateInterface(id, data);
            success(res, interface_, '接口更新成功');
        }
        catch (error: any) {
            logger.error('Error updating interface:', error);
            throw error;
        }
    }
    @Delete(':id')
    @IdentityRoute({ permission: ['api-interface', 'delete'] })
    async deleteInterface(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const result = await this.apiBuilderService.deleteInterface(id);
            success(res, result, result.message);
        }
        catch (error: any) {
            logger.error('Error deleting interface:', error);
            throw error;
        }
    }
    @Post('test-sql')
    @IdentityRoute({ permission: ['api-interface', 'read'] })
    async testSql(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { sql_query, parameters } = req.body;
            if (!sql_query) {
                const ApiError = shared('utils/ApiError');
                throw ApiError.badRequest('请输入SQL查询语句');
            }
            const result = await this.apiBuilderService.testSql(sql_query, parameters || {});
            success(res, result, 'SQL查询成功');
        }
        catch (error: any) {
            logger.error('Error testing SQL:', error);
            throw error;
        }
    }
    @Post('execute-sql')
    @IdentityRoute({ permission: ['api-interface', 'read'] })
    async executeSql(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { sql_query, parameters } = req.body;
            if (!sql_query) {
                const ApiError = shared('utils/ApiError');
                throw ApiError.badRequest('请输入SQL查询语句');
            }
            const result = await this.apiBuilderService.executeSql(sql_query, parameters || {});
            success(res, result, '执行成功');
        }
        catch (error: any) {
            logger.error('Error executing SQL:', error);
            throw error;
        }
    }
}
