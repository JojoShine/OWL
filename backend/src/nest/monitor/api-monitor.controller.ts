import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { ApiMonitorService } from './api-monitor.service';
const { success } = shared('utils/response');
@Controller('api/system/monitor')
@UseGuards(IdentityGuard)
export class ApiMonitorController {
    constructor(private readonly service: ApiMonitorService) { }
    @Get('apis')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getAllMonitors(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { page, limit, enabled } = req.query;
            const result = await this.service.getAllMonitors({ page, limit, enabled });
            return success(res, result, '获取监控列表成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('apis/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getMonitorById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const monitor = await this.service.getMonitorById(id);
            return success(res, monitor, '获取监控配置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('apis')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "create"] })
    async createMonitor(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const data = {
                ...req.body,
                created_by: req.user.id, // 从认证中间件获取当前用户 ID
            };
            const monitor = await this.service.createMonitor(data);
            return success(res, monitor, '创建监控配置成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put('apis/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "update"] })
    async updateMonitor(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const monitor = await this.service.updateMonitor(id, req.body);
            return success(res, monitor, '更新监控配置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete('apis/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "delete"] })
    async deleteMonitor(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const result = await this.service.deleteMonitor(id);
            return success(res, result, '删除监控配置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('apis/:id/test')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "create"] })
    async testApi(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const log = await this.service.testApi(id);
            return success(res, log, '接口测试完成');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('apis/:id/logs')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getMonitorLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const { page, limit, status, startDate, endDate } = req.query;
            const result = await this.service.getMonitorLogs(id, {
                page,
                limit,
                status,
                startDate,
                endDate,
            });
            return success(res, result, '获取监控日志成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('apis/:id/stats')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getMonitorStats(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const { hours = 24 } = req.query;
            const stats = await this.service.getMonitorStats(id, parseInt(hours));
            return success(res, stats, '获取监控统计成功');
        }
        catch (error: any) {
            throw error;
        }
    }
}
