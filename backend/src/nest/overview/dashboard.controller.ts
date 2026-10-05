import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { DashboardService } from './dashboard.service';
const { success } = shared('utils/response');
const { logger } = shared('config/logger');
@Controller('api/system/dashboard')
@UseGuards(IdentityGuard)
export class DashboardController {
    constructor(private readonly service: DashboardService) { }
    @Get('')
    @IdentityRoute({})
    async getDashboard(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const data = await this.service.getDashboardData();
            success(res, data, '获取仪表板数据成功');
        }
        catch (error: any) {
            logger.error('Dashboard错误:', error);
            throw error;
        }
    }
    @Get('metrics')
    @IdentityRoute({})
    async getMetrics(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const data = await this.service.getMetrics();
            success(res, data, '获取指标数据成功');
        }
        catch (error: any) {
            logger.error('指标数据获取错误:', error);
            throw error;
        }
    }
    @Get('recent-logins')
    @IdentityRoute({})
    async getRecentLogins(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const data = await this.service.getRecentLoginUsers(limit);
            success(res, data, '获取最近登录用户成功');
        }
        catch (error: any) {
            logger.error('最近登录用户获取错误:', error);
            throw error;
        }
    }
    @Get('online-users')
    @IdentityRoute({})
    async getOnlineUsers(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const data = await this.service.getOnlineUsers();
            success(res, data, '获取在线用户成功');
        }
        catch (error: any) {
            logger.error('在线用户获取错误:', error);
            throw error;
        }
    }
    @Get('system-overview')
    @IdentityRoute({})
    async getSystemOverview(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const data = await this.service.getSystemOverview();
            success(res, data, '获取系统概览成功');
        }
        catch (error: any) {
            logger.error('系统概览获取错误:', error);
            throw error;
        }
    }
    @Get('storage-overview')
    @IdentityRoute({})
    async getStorageOverview(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const data = await this.service.getStorageOverview();
            success(res, data, '获取存储概览成功');
        }
        catch (error: any) {
            logger.error('存储概览获取错误:', error);
            throw error;
        }
    }
    @Get('recent-operations')
    @IdentityRoute({})
    async getRecentOperations(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const limit = parseInt(req.query.limit) || 8;
            const data = await this.service.getRecentOperations(limit);
            success(res, data, '获取最近操作成功');
        }
        catch (error: any) {
            logger.error('最近操作获取错误:', error);
            throw error;
        }
    }
    @Get('access-trend')
    @IdentityRoute({})
    async getAccessTrend(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const data = await this.service.getAccessTrend();
            success(res, data, '获取访问趋势成功');
        }
        catch (error: any) {
            logger.error('访问趋势获取错误:', error);
            throw error;
        }
    }
}
