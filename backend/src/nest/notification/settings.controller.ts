import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { NotificationSettingsService } from './settings.service';
const { success } = shared('utils/response');
@Controller('api/system/notifications')
@UseGuards(IdentityGuard)
export class SettingsController {
    constructor(private readonly service: NotificationSettingsService) { }
    @Get('settings')
    @IdentityRoute({})
    async getSettings(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const settings = await this.service.getUserSettings(userId);
            success(res, settings, '获取通知设置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put('settings')
    @IdentityRoute({ "validation": ["notification", "updateNotificationSettings"] })
    async updateSettings(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const settings = await this.service.updateUserSettings(userId, req.body);
            success(res, settings, '更新通知设置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('settings/reset')
    @IdentityRoute({})
    async resetSettings(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const settings = await this.service.resetUserSettings(userId);
            success(res, settings, '重置通知设置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
}
