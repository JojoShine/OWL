import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { LogService } from './log.service';
const { success } = shared('utils/response');
@Controller('api/system/logs')
@UseGuards(IdentityGuard)
export class LogController {
    constructor(private readonly service: LogService) { }
    @Get('operations')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["log", "read"], "validation": ["log", "queryLogs"] })
    async getOperationLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.getOperationLogs(req.query);
            success(res, result, '获取操作日志成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('logins')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["log", "read"], "validation": ["log", "queryLogs"] })
    async getLoginLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.getLoginLogs(req.query);
            success(res, result, '获取登录日志成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('system')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["log", "read"], "validation": ["log", "queryLogs"] })
    async getSystemLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.getSystemLogs(req.query);
            success(res, result, '获取系统日志成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('access')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["log", "read"], "validation": ["log", "queryLogs"] })
    async getAccessLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.getAccessLogs(req.query);
            success(res, result, '获取访问日志成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('errors')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["log", "read"], "validation": ["log", "queryLogs"] })
    async getErrorLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.getErrorLogs(req.query);
            success(res, result, '获取错误日志成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('database')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["log", "read"], "validation": ["log", "queryLogs"] })
    async getDatabaseAccessLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.getDatabaseAccessLogs(req.query);
            success(res, result, '获取数据库访问日志成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('stats')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["log", "read"], "validation": ["log", "queryStats"] })
    async getStats(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { type, startDate, endDate } = req.query;
            const result = await this.service.getStats(type, startDate, endDate);
            success(res, result, '获取日志统计成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('export')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["log", "create"], "validation": ["log", "exportLogs"] })
    async exportLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { type, format = 'json', ...query } = req.body;
            if (!type) {
                return res.status(400).json({
                    success: false,
                    message: '请指定日志类型',
                });
            }
            const data = await this.service.exportLogs(type, query, format);
            if (format === 'csv') {
                // 返回CSV文件
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename=logs-${type}-${Date.now()}.csv`);
                return res.send('\uFEFF' + data); // 添加BOM以支持Excel正确显示中文
            }
            // 返回JSON文件
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=logs-${type}-${Date.now()}.json`);
            return res.send(JSON.stringify(data, null, 2));
        }
        catch (error: any) {
            throw error;
        }
    }
}
