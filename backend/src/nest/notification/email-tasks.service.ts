import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live, pick, requireRow } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
import { EmailService } from './email.service';
const cron = require('node-cron');
const frequencies: Record<string, string> = { hourly: '0 * * * *', daily: '0 9 * * *', weekly: '0 9 * * 1', monthly: '0 9 1 * *' };
@Injectable()
export class EmailTasksService {
    private jobs = new Map<string, any>();
    private executions = new Map<string, Promise<void>>();
    private stopping = false;
    constructor(private readonly db: PrismaService, private readonly email: EmailService) { }
    async initializeTasks() { this.stopping = false; for (const task of await this.db.owl_email_tasks.findMany({ where: { enabled: true, ...live } }))
        this.scheduleTask(task); }
    getCronExpression(frequency: string) { return frequencies[frequency] || null; }
    scheduleTask(task: any) { if (this.stopping || !task.enabled || !frequencies[task.frequency] || this.jobs.has(task.id))
        return; this.jobs.set(task.id, cron.schedule(frequencies[task.frequency], () => { void this.executeTask(task.id).catch(() => { }); }, { timezone: 'Asia/Shanghai' })); }
    unscheduleTask(id: string) { const job = this.jobs.get(id); job?.stop(); job?.destroy?.(); this.jobs.delete(id); }
    async stop() { this.stopping = true; for (const id of this.jobs.keys())
        this.unscheduleTask(id); await Promise.allSettled(this.executions.values()); }
    isValidEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
    parseRecipients(value: string) { return value.split(',').map(email => email.trim()).filter(email => this.isValidEmail(email)); }
    executeTask(id: string, manual = false): Promise<void> {
        if (this.stopping || this.executions.has(id))
            return this.executions.get(id) || Promise.resolve();
        const execution = this.run(id, manual).finally(() => this.executions.delete(id));
        this.executions.set(id, execution);
        return execution;
    }
    private async run(id: string, manual: boolean) {
        const task = await this.db.owl_email_tasks.findFirst({ where: { id, ...live } });
        if (!task || (!manual && !task.enabled))
            return;
        try {
            const recipients = this.parseRecipients(task.recipients);
            if (!recipients.length)
                throw new Error('没有有效的收件人邮箱');
            const result = await this.email.sendEmailByTemplate(task.template_id, recipients, task.template_variables || {});
            await this.updateTaskStatus(id, result.failedCount ? 'failed' : 'success', result.failedCount ? `发送失败: ${result.failedCount}/${recipients.length}` : null);
        }
        catch (error: any) {
            await this.updateTaskStatus(id, 'failed', error.message);
        }
    }
    async updateTaskStatus(id: string, status: string, error: string | null = null) { await this.db.owl_email_tasks.updateMany({ where: { id, ...live }, data: { last_executed_at: new Date(), last_status: status, last_error: error, execution_count: { increment: 1 }, updatedAt: new Date() } }); }
    async getAllTasks(query: any = {}) { const page = Number(query.page) || 1, limit = Number(query.limit) || 20; const where: any = { ...live }; if (query.enabled !== undefined)
        where.enabled = query.enabled === true || query.enabled === 'true'; if (query.keyword)
        where.name = { contains: query.keyword, mode: 'insensitive' }; const [items, total] = await Promise.all([this.db.owl_email_tasks.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }), this.db.owl_email_tasks.count({ where })]); return { items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) }; }
    getTaskById(id: string) { return requireRow(this.db.owl_email_tasks, id, '邮件任务'); }
    private data(body: any) { return pick(body, ['name', 'description', 'template_id', 'recipients', 'frequency', 'enabled', 'template_variables']); }
    async createTask(body: any, userId: string) { if (!this.parseRecipients(body.recipients).length)
        throw new BadRequestException('请填写至少一个有效的收件人邮箱'); await requireRow(this.db.owl_email_templates, body.template_id, '邮件模板'); const task = await this.db.owl_email_tasks.create({ data: { ...this.data(body), name: body.name, template_id: body.template_id, recipients: body.recipients, created_by: userId } }); this.scheduleTask(task); return task; }
    async updateTask(id: string, body: any, userId: string) { await this.getTaskById(id); if (body.recipients && !this.parseRecipients(body.recipients).length)
        throw new BadRequestException('请填写至少一个有效的收件人邮箱'); if (body.template_id)
        await requireRow(this.db.owl_email_templates, body.template_id, '邮件模板'); const task = await this.db.owl_email_tasks.update({ where: { id }, data: { ...this.data(body), updated_by: userId, updatedAt: new Date() } }); this.unscheduleTask(id); this.scheduleTask(task); return task; }
    async deleteTask(id: string, userId: string) { await this.getTaskById(id); await this.db.owl_email_tasks.update({ where: { id }, data: { ...deleted(), deleted_by: userId } }); this.unscheduleTask(id); }
    async enableTask(id: string) { await this.getTaskById(id); const task = await this.db.owl_email_tasks.update({ where: { id }, data: { enabled: true, updatedAt: new Date() } }); this.scheduleTask(task); return task; }
    async disableTask(id: string) { await this.getTaskById(id); const task = await this.db.owl_email_tasks.update({ where: { id }, data: { enabled: false, updatedAt: new Date() } }); this.unscheduleTask(id); return task; }
    async manualExecuteTask(id: string) { await this.getTaskById(id); await this.executeTask(id, true); }
}
