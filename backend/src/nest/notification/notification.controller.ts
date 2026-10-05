import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { NotificationsService } from './notifications.service';
import { NotificationSocket } from './socket.service';
const { success, paginated } = shared('utils/response');
@Controller('api/system/notifications')
@UseGuards(IdentityGuard)
export class NotificationController {
    constructor(private readonly service: NotificationsService, private readonly socket: NotificationSocket) { }
    @Get('')
    @IdentityRoute({ "validation": ["notification", "getNotifications"] })
    async getNotifications(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const result = await this.service.getUserNotifications(userId, req.query);
            paginated(res, result.notifications, {
                total: result.total,
                page: result.page,
                limit: result.pageSize,
                totalPages: result.totalPages,
            }, '获取通知列表成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('unread-count')
    @IdentityRoute({})
    async getUnreadCount(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const count = await this.service.getUnreadCount(userId);
            success(res, { count }, '获取未读消息数量成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put('read-all')
    @IdentityRoute({})
    async markAllAsRead(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const updatedCount = await this.service.markAllAsRead(userId);
            success(res, { count: updatedCount }, '标记所有已读成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete('clear')
    @IdentityRoute({})
    async clearReadNotifications(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const deletedCount = await this.service.clearReadNotifications(userId);
            success(res, { count: deletedCount }, '清空已读消息成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('send')
    @IdentityRoute({ "roles": ["super_admin", "admin"], "validation": ["notification", "sendNotification"] })
    async sendNotification(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { user_id, title, content, type, link } = req.body;
            // 创建通知
            const notification = await this.service.createNotification({
                user_id,
                title,
                content,
                type,
                link,
            });
            // 如果用户在线，实时推送
            if (this.socket.isUserOnline(user_id)) {
                this.socket.pushNotification(user_id, notification);
            }
            success(res, notification, '发送通知成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('broadcast')
    @IdentityRoute({ "roles": ["super_admin", "admin"], "validation": ["notification", "broadcastNotification"] })
    async broadcastNotification(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { title, content, type, link } = req.body;
            // 创建广播通知
            const result = await this.service.sendBroadcast({
                title,
                content,
                type,
                link,
            });
            // 实时推送给在线用户（发送完整的通知对象）
            this.socket.broadcast('notification', {
                id: result.sampleNotification?.id || null,
                title,
                content,
                type,
                link,
                is_read: false,
                created_at: new Date().toISOString(),
            });
            success(res, { count: result.count }, '广播通知成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('stats')
    @IdentityRoute({})
    async getNotificationStats(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const stats = await this.service.getNotificationStats(userId);
            success(res, stats, '获取通知统计成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get(':id')
    @IdentityRoute({ "validation": ["notification", "getNotificationById"] })
    async getNotificationById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const notification = await this.service.getNotificationById(req.params.id, userId);
            success(res, notification, '获取通知详情成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put(':id/read')
    @IdentityRoute({ "validation": ["notification", "markAsRead"] })
    async markAsRead(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            const notification = await this.service.markAsRead(req.params.id, userId);
            success(res, notification, '标记已读成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete(':id')
    @IdentityRoute({ "validation": ["notification", "deleteNotification"] })
    async deleteNotification(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const userId = req.user.id;
            await this.service.deleteNotification(req.params.id, userId);
            success(res, null, '删除通知成功');
        }
        catch (error: any) {
            throw error;
        }
    }
}
