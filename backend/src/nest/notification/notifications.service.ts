import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
@Injectable()
export class NotificationsService {
    constructor(private readonly db: PrismaService) { }
    createNotification(data: any) {
        return this.db.owl_notifications.create({ data: { user_id: data.user_id, title: data.title, content: data.content, type: data.type || 'info', link: data.link || null } });
    }
    private async withUser(row: any) {
        return { ...row, user: await this.db.owl_users.findFirst({ where: { id: row.user_id, ...live }, select: { id: true, username: true, real_name: true, email: true, avatar: true } }) };
    }
    async getUserNotifications(userId: string, options: any = {}) {
        const page = Number(options.page) || 1, limit = Number(options.limit) || 20;
        if (!userId)
            return { notifications: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
        const where: any = { user_id: userId, ...live };
        if (options.type)
            where.type = options.type;
        if (options.isRead !== undefined)
            where.is_read = options.isRead === true || options.isRead === 'true';
        const [total, rows] = await Promise.all([this.db.owl_notifications.count({ where }), this.db.owl_notifications.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit })]);
        return { notifications: await Promise.all(rows.map(row => this.withUser(row))), total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
    }
    getUnreadCount(userId: string) { return userId ? this.db.owl_notifications.count({ where: { user_id: userId, is_read: false, ...live } }) : Promise.resolve(0); }
    private async owned(id: string, userId: string) { const row = await this.db.owl_notifications.findFirst({ where: { id, user_id: userId, ...live } }); if (!row)
        throw new NotFoundException('通知不存在或无权访问'); return row; }
    async getNotificationById(id: string, userId: string) { return this.withUser(await this.owned(id, userId)); }
    async markAsRead(id: string, userId: string) { const row = await this.owned(id, userId); return row.is_read ? row : this.db.owl_notifications.update({ where: { id }, data: { is_read: true, read_at: new Date(), updatedAt: new Date() } }); }
    async markAllAsRead(userId: string) { return (await this.db.owl_notifications.updateMany({ where: { user_id: userId, is_read: false, ...live }, data: { is_read: true, read_at: new Date(), updatedAt: new Date() } })).count; }
    async deleteNotification(id: string, userId: string) { await this.owned(id, userId); await this.db.owl_notifications.update({ where: { id }, data: deleted() }); return true; }
    async clearReadNotifications(userId: string) { return (await this.db.owl_notifications.updateMany({ where: { user_id: userId, is_read: true, ...live }, data: deleted() })).count; }
    async sendBroadcast(data: any) {
        const users = await this.db.owl_users.findMany({ where: { status: 'active', ...live }, select: { id: true } });
        if (!users.length)
            return { count: 0, sampleNotification: null };
        const rows = await this.db.owl_notifications.createManyAndReturn({ data: users.map(user => ({ user_id: user.id, title: data.title, content: data.content, type: data.type || 'system', link: data.link || null })) });
        return { count: rows.length, sampleNotification: rows[0] };
    }
    async getNotificationStats(userId: string) {
        const where = { user_id: userId, ...live };
        const [total, unread, groups] = await Promise.all([this.db.owl_notifications.count({ where }), this.getUnreadCount(userId), this.db.owl_notifications.groupBy({ by: ['type'], where, _count: true })]);
        return { total, unread, read: total - unread, byType: Object.fromEntries(groups.map(row => [row.type, row._count])) };
    }
}
