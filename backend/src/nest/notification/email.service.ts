import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live } from '../identity/identity.helpers';
import { EmailTemplatesService } from './templates.service';
const nodemailer = require('nodemailer');
function escapeHtml(text: any) {
    if (!text)
        return '';
    if (typeof text !== 'string')
        return String(text);
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char: string) => map[char]);
}
@Injectable()
export class MailTransport implements OnApplicationShutdown {
    private transporter: any;
    constructor() {
        if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            const port = Number(process.env.SMTP_PORT) || 465;
            this.transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.163.com', port, secure: process.env.SMTP_SECURE === undefined ? port === 465 : process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
        }
    }
    get available() { return !!this.transporter; }
    send(data: any) { return this.transporter.sendMail({ from: { name: process.env.SMTP_FROM_NAME || 'Common Management Platform', address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER }, ...data }); }
    onApplicationShutdown() { this.transporter?.close(); }
}
@Injectable()
export class EmailService {
    constructor(private readonly db: PrismaService, private readonly templates: EmailTemplatesService, private readonly transport: MailTransport) { }
    isEmailAvailable() { return this.transport.available; }
    async sendEmail(data: any) {
        const log: any = { to_email: data.to, subject: data.subject, content: data.html || data.text, template_name: data.templateName || null, retry_count: 0 };
        if (!this.transport.available) {
            const error = 'SMTP 服务未配置，无法发送邮件。请配置 SMTP_USER 和 SMTP_PASSWORD';
            await this.db.owl_email_logs.create({ data: { ...log, status: 'failed', error_message: error } });
            return { success: false, error, message: '邮件服务未配置' };
        }
        let info: any;
        try {
            info = await this.transport.send({ to: data.to, subject: data.subject, html: data.html, text: data.text });
        }
        catch (error: any) {
            await this.db.owl_email_logs.create({ data: { ...log, status: 'failed', error_message: error.message } });
            throw new Error(`邮件发送失败: ${error.message}`);
        }
        await this.db.owl_email_logs.create({ data: { ...log, status: 'sent', sent_at: new Date() } });
        return { success: true, messageId: info.messageId, response: info.response };
    }
    async sendEmailWithTemplate(data: any) { const rendered = await this.templates.renderTemplateByName(data.templateName, data.variables || {}); return this.sendEmail({ to: data.to, subject: rendered.subject, html: rendered.content, templateName: data.templateName }); }
    wrapAlertContent(title: string, content: string) {
        // 转义 HTML 特殊字符，防止 XSS
        const escapedTitle = escapeHtml(title);
        const escapedContent = escapeHtml(content);
        return `
      <div style="font-family: Arial, sans-serif; padding: 16px; background-color: #f6f8fa;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
          <h2 style="margin-top: 0; font-size: 20px; color: #333333;">${escapedTitle}</h2>
          <div style="font-size: 14px; color: #333333; line-height: 1.6; white-space: pre-wrap;">
            ${escapedContent}
          </div>
        </div>
        <p style="margin-top: 16px; font-size: 12px; color: #999999; text-align: center;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `;
    }
    private async batch(recipients: string[], data: any) { const results = await Promise.allSettled(recipients.map(to => this.sendEmail({ ...data, to }))); const successCount = results.filter(item => item.status === 'fulfilled' && item.value.success).length; return { success: successCount === results.length, total: results.length, successCount, failedCount: results.length - successCount, results }; }
    async sendAlertEmail(payload: any) {
        const { templateId, recipients, title = '系统告警通知', content = '' } = payload;
        if (!this.isEmailAvailable())
            return { success: false, error: '邮件服务未配置，无法发送告警邮件', total: recipients?.length || 0, successCount: 0, failedCount: recipients?.length || 0 };
        if (!Array.isArray(recipients) || !recipients.length)
            throw new Error('告警邮件发送失败：缺少接收人');
        if (templateId) {
            const template = await this.templates.getTemplateById(templateId);
            const rendered = await this.templates.renderTemplateByName(template.name, { title, content });
            return this.batch(recipients, { subject: rendered.subject, html: rendered.content, templateName: template.name });
        }
        return this.batch(recipients, { subject: title, html: this.wrapAlertContent(title, content) });
    }
    async sendEmailByTemplate(id: string, recipients: string[], variables: any = {}) { const template = await this.templates.getTemplateById(id); return this.batch(recipients, { subject: template.subject, html: this.wrapAlertContent(template.subject, template.content) }); }
    async sendEmailWithRetry(data: any, maxRetries = 3) { let error: any; for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await this.sendEmail(data);
        }
        catch (cause) {
            error = cause;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                const row = await this.db.owl_email_logs.findFirst({ where: { to_email: data.to, subject: data.subject, status: 'failed', ...live }, orderBy: { createdAt: 'desc' } });
                if (row)
                    await this.db.owl_email_logs.update({ where: { id: row.id }, data: { retry_count: attempt, updatedAt: new Date() } });
            }
        }
    } throw error; }
    sendTestEmail(to: string) { return this.sendEmail({ to, subject: '邮件服务测试 - Common Management Platform', text: '这是一封测试邮件，用于验证邮件服务配置是否正确。', html: this.wrapAlertContent('邮件服务测试', '这是一封测试邮件，用于验证邮件服务配置是否正确。') }); }
    async getEmailLogs(options: any = {}) { const page = Number(options.page) || 1, limit = Number(options.limit) || 20; const where = { ...live, ...(options.status ? { status: options.status } : {}), ...(options.toEmail ? { to_email: options.toEmail } : {}) }; const [logs, total] = await Promise.all([this.db.owl_email_logs.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.db.owl_email_logs.count({ where })]); return { logs, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) }; }
}
