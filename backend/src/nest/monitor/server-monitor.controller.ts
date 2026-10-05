import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { ServerMonitorService } from './server-monitor.service';
const ApiError = shared('utils/ApiError');
@Controller('api/system/monitor')
@UseGuards(IdentityGuard)
export class ServerMonitorController {
    constructor(private readonly service: ServerMonitorService) { }
    @Get('servers')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getAllServers(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { page, limit, enabled, status } = req.query;
            const result = await this.service.getAllServers({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                enabled: enabled === 'true' ? true : enabled === 'false' ? false : undefined,
                status,
            });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Get('servers/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getServerById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const server = await this.service.getServerById(id);
            if (!server) {
                throw new ApiError(404, '服务器不存在');
            }
            res.json({
                success: true,
                data: server,
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Post('servers')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "create"] })
    async createServer(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const server = await this.service.createServer(req.body, req.user.id);
            // 如果启用，立即执行一次检测，然后启动定时监控
            if (server.enabled) {
                this.service.checkServer(server.id).catch(console.error);
                this.service.startMonitoring(server.id);
            }
            res.status(201).json({
                success: true,
                data: server,
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Put('servers/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "update"] })
    async updateServer(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const server = await this.service.updateServer(id, req.body, req.user.id);
            // 重新启动定时任务
            if (server.enabled) {
                this.service.startMonitoring(server.id);
            }
            else {
                this.service.stopMonitoring(server.id);
            }
            res.json({
                success: true,
                data: server,
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Delete('servers/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "delete"] })
    async deleteServer(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            await this.service.deleteServer(id, req.user.id);
            res.json({
                success: true,
                message: '删除成功',
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Post('servers/:id/test')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "create"] })
    async testConnection(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const result = await this.service.testConnection(id);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message || 'SSH连接失败');
        }
    }
    @Get('servers/:id/logs')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getServerLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const { page, limit } = req.query;
            const result = await this.service.getServerLogs(id, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
            });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Post('servers/:id/toggle')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "update"] })
    async toggleMonitoring(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const server = await this.service.toggleMonitoring(id);
            res.json({
                success: true,
                data: server,
                message: server.enabled ? '已启动监控' : '已停止监控',
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Post('servers/:id/check')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "create"] })
    async triggerCheck(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            await this.service.checkServer(id);
            res.json({
                success: true,
                message: '检查完成',
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Post('servers/:id/ports')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "create"] })
    async addPort(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const port = await this.service.addPort(id, req.body);
            res.status(201).json({
                success: true,
                data: port,
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Put('ports/:portId')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "update"] })
    async updatePort(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { portId } = req.params;
            const port = await this.service.updatePort(portId, req.body);
            res.json({
                success: true,
                data: port,
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
    @Delete('ports/:portId')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "delete"] })
    async deletePort(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { portId } = req.params;
            await this.service.deletePort(portId);
            res.json({
                success: true,
                message: '删除成功',
            });
        }
        catch (error: any) {
            throw new ApiError(500, error.message);
        }
    }
}
