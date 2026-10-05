import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { AlertService } from './alert.service';
@Controller('api/system/monitor')
@UseGuards(IdentityGuard)
export class AlertController {
    constructor(private readonly service: AlertService) { }
    @Get('alerts/rules')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getAllRules(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { page, limit, enabled, metric_type } = req.query;
            const result = await this.service.getAllRules({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                enabled: enabled !== undefined ? enabled === 'true' : undefined,
                metric_type,
            });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error: any) {
            console.error('获取告警规则失败:', error);
            res.status(500).json({
                success: false,
                message: error.message || '获取告警规则失败',
            });
        }
    }
    @Get('alerts/rules/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getRuleById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const rule = await this.service.getRuleById(id);
            res.json({
                success: true,
                data: rule,
            });
        }
        catch (error: any) {
            console.error('获取告警规则失败:', error);
            res.status(404).json({
                success: false,
                message: error.message || '获取告警规则失败',
            });
        }
    }
    @Post('alerts/rules')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "create"] })
    async createRule(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const rule = await this.service.createRule(req.body);
            res.status(201).json({
                success: true,
                data: rule,
                message: '创建告警规则成功',
            });
        }
        catch (error: any) {
            console.error('创建告警规则失败:', error);
            res.status(400).json({
                success: false,
                message: error.message || '创建告警规则失败',
            });
        }
    }
    @Put('alerts/rules/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "update"] })
    async updateRule(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const rule = await this.service.updateRule(id, req.body);
            res.json({
                success: true,
                data: rule,
                message: '更新告警规则成功',
            });
        }
        catch (error: any) {
            console.error('更新告警规则失败:', error);
            res.status(400).json({
                success: false,
                message: error.message || '更新告警规则失败',
            });
        }
    }
    @Delete('alerts/rules/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "delete"] })
    async deleteRule(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const result = await this.service.deleteRule(id);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error: any) {
            console.error('删除告警规则失败:', error);
            res.status(400).json({
                success: false,
                message: error.message || '删除告警规则失败',
            });
        }
    }
    @Get('alerts/history')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getAlertHistory(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { page, limit, rule_id, level, status, startDate, endDate } = req.query;
            const result = await this.service.getAlertHistory({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 50,
                rule_id,
                level,
                status,
                startDate,
                endDate,
            });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error: any) {
            console.error('获取告警历史失败:', error);
            res.status(500).json({
                success: false,
                message: error.message || '获取告警历史失败',
            });
        }
    }
    @Put('alerts/history/:id/resolve')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "update"] })
    async resolveAlert(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { id } = req.params;
            const alert = await this.service.resolveAlert(id);
            res.json({
                success: true,
                data: alert,
                message: '告警已标记为已解决',
            });
        }
        catch (error: any) {
            console.error('解决告警失败:', error);
            res.status(400).json({
                success: false,
                message: error.message || '解决告警失败',
            });
        }
    }
    @Get('alerts/stats')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "read"] })
    async getAlertStats(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { hours } = req.query;
            const stats = await this.service.getAlertStats(hours ? parseInt(hours) : 24);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error: any) {
            console.error('获取告警统计失败:', error);
            res.status(500).json({
                success: false,
                message: error.message || '获取告警统计失败',
            });
        }
    }
    @Post('alerts/check')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["monitor", "create"] })
    async triggerCheck(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            await this.service.checkAllRules();
            res.json({
                success: true,
                message: '告警检查已触发',
            });
        }
        catch (error: any) {
            console.error('触发告警检查失败:', error);
            res.status(500).json({
                success: false,
                message: error.message || '触发告警检查失败',
            });
        }
    }
}
