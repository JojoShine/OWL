import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { DynamicGuard, DynamicAction } from './dynamic.guard';
import { GenericService } from './generic.service';
const { success, paginated } = shared('utils/response');
const ApiError = shared('utils/ApiError');
const { logger } = shared('config/logger');
@Controller('api/modules/:modulePath')
@UseGuards(DynamicGuard)
export class GenericController {
    constructor(private readonly service: GenericService) { }
    @Get('')
    @DynamicAction('read')
    async list(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const moduleConfig = req.moduleConfig;
            if (!moduleConfig) {
                throw ApiError.internal('模块配置未加载');
            }
            const result = await this.service.list(moduleConfig, req.query);
            paginated(res, result.data, result.pagination, `获取${moduleConfig.description}列表成功`);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete('batch')
    @DynamicAction('delete')
    async batchDelete(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const moduleConfig = req.moduleConfig;
            if (!moduleConfig) {
                throw ApiError.internal('模块配置未加载');
            }
            const { ids } = req.body;
            const result = await this.service.batchDelete(moduleConfig, ids, req.user?.id);
            success(res, result, `批量删除${moduleConfig.description}成功`);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('export')
    @DynamicAction('read')
    async export(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const moduleConfig = req.moduleConfig;
            if (!moduleConfig) {
                throw ApiError.internal('模块配置未加载');
            }
            const items = await this.service.export(moduleConfig, req.query);
            success(res, items, `导出${moduleConfig.description}数据成功`);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('download-template')
    @DynamicAction('read')
    async downloadTemplate(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const moduleConfig = req.moduleConfig;
            if (!moduleConfig) {
                throw ApiError.internal('模块配置未加载');
            }
            const template = await this.service.downloadTemplate(moduleConfig);
            success(res, template, `获取${moduleConfig.description}导入模板成功`);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('import')
    @DynamicAction('create')
    async importFromExcel(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const moduleConfig = req.moduleConfig;
            req.setTimeout(300000);
            res.setTimeout(300000);
            const { rows } = req.body;
            if (!moduleConfig) {
                throw ApiError.internal('模块配置未加载');
            }
            if (!rows || !Array.isArray(rows)) {
                throw ApiError.badRequest('导入数据格式错误');
            }
            const result = await this.service.importFromExcel(moduleConfig, rows);
            success(res, result, `导入${moduleConfig.description}数据成功`);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get(':id')
    @DynamicAction('read')
    async getById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const moduleConfig = req.moduleConfig;
            if (!moduleConfig) {
                throw ApiError.internal('模块配置未加载');
            }
            const item = await this.service.getById(moduleConfig, req.params.id);
            success(res, item, `获取${moduleConfig.description}详情成功`);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('')
    @DynamicAction('create')
    async create(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const moduleConfig = req.moduleConfig;
            if (!moduleConfig) {
                throw ApiError.internal('模块配置未加载');
            }
            const item = await this.service.create(moduleConfig, req.body, req.user?.id);
            success(res, item, `创建${moduleConfig.description}成功`, 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put(':id')
    @DynamicAction('update')
    async update(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const moduleConfig = req.moduleConfig;
            if (!moduleConfig) {
                throw ApiError.internal('模块配置未加载');
            }
            const item = await this.service.update(moduleConfig, req.params.id, req.body, req.user?.id);
            success(res, item, `更新${moduleConfig.description}成功`);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete(':id')
    @DynamicAction('delete')
    async delete(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const moduleConfig = req.moduleConfig;
            if (!moduleConfig) {
                throw ApiError.internal('模块配置未加载');
            }
            const result = await this.service.delete(moduleConfig, req.params.id, req.user?.id);
            success(res, result, `删除${moduleConfig.description}成功`);
        }
        catch (error: any) {
            throw error;
        }
    }
}
