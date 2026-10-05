import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live, pick } from '../identity/identity.helpers';
const defaults = { email_enabled: true, push_enabled: true, system_notification: true, warning_notification: true, error_notification: true };
@Injectable()
export class NotificationSettingsService {
    constructor(private readonly db: PrismaService) { }
    async getUserSettings(userId: string) { return await this.db.owl_notification_settings.findFirst({ where: { user_id: userId, ...live } }) || this.createDefaultSettings(userId); }
    async createDefaultSettings(userId: string) { return this.db.$transaction(async (tx) => { await tx.$queryRaw `SELECT id FROM owl_users WHERE id = ${userId}::uuid FOR UPDATE`; return await tx.owl_notification_settings.findFirst({ where: { user_id: userId, ...live } }) || tx.owl_notification_settings.create({ data: { user_id: userId, ...defaults } }); }); }
    async updateUserSettings(userId: string, body: any) { const row = await this.getUserSettings(userId); return this.db.owl_notification_settings.update({ where: { id: row.id }, data: { ...pick(body, Object.keys(defaults)), updatedAt: new Date() } }); }
    resetUserSettings(userId: string) { return this.updateUserSettings(userId, defaults); }
    async isNotificationEnabled(userId: string, type: string) { const row: any = await this.getUserSettings(userId); return !!row.push_enabled && (!['system', 'warning', 'error'].includes(type) || !!row[`${type}_notification`]); }
    async isEmailEnabled(userId: string) { return (await this.getUserSettings(userId)).email_enabled; }
    async isPushEnabled(userId: string) { return (await this.getUserSettings(userId)).push_enabled; }
    async getBatchUserSettings(userIds: string[]) { return new Map(await Promise.all(userIds.map(async (id) => [id, await this.getUserSettings(id)] as const))); }
}
