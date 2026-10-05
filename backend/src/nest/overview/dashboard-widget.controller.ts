import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { DashboardWidgetService } from './dashboard-widget.service';
const { success, list } = shared('utils/response');
const { logger } = shared('config/logger');
@Controller('api/system/dashboard-widgets')
@UseGuards(IdentityGuard)
export class DashboardWidgetController {
    constructor(private readonly service: DashboardWidgetService) { }
    @Get('execute')
    @IdentityRoute({})
    async executeAllEnabled(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const results = await this.service.executeAllEnabled();
            success(res, results, '执行成功');
        }
        catch (error: any) {
            logger.error('批量执行 Widget 失败:', error);
            throw error;
        }
    }
    @Get('')
    @IdentityRoute({ "roles": ["admin", "super_admin"] })
    async getAll(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const widgets = await this.service.getAll();
            list(res, widgets, '获取 Widget 列表成功');
        }
        catch (error: any) {
            logger.error('获取 Widget 列表失败:', error);
            throw error;
        }
    }
    @Get(':id')
    @IdentityRoute({ "roles": ["admin", "super_admin"] })
    async getById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const widget = await this.service.getById(req.params.id);
            success(res, widget, '获取 Widget 成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('')
    @IdentityRoute({ "roles": ["admin", "super_admin"] })
    async create(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const widget = await this.service.create(req.body, req.user.id);
            success(res, widget, '创建 Widget 成功', 201);
        }
        catch (error: any) {
            logger.error('创建 Widget 失败:', error);
            throw error;
        }
    }
    @Put(':id')
    @IdentityRoute({ "roles": ["admin", "super_admin"] })
    async update(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const widget = await this.service.update(req.params.id, req.body);
            success(res, widget, '更新 Widget 成功');
        }
        catch (error: any) {
            logger.error('更新 Widget 失败:', error);
            throw error;
        }
    }
    @Delete(':id')
    @IdentityRoute({ "roles": ["admin", "super_admin"] })
    async delete(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.delete(req.params.id);
            success(res, result, '删除 Widget 成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post(':id/execute')
    @IdentityRoute({ "roles": ["admin", "super_admin"] })
    async executeWidget(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.executeWidget(req.params.id);
            success(res, result, '执行成功');
        }
        catch (error: any) {
            logger.error('执行 Widget SQL 失败:', error);
            throw error;
        }
    }
}
