import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { EmailService } from './email.service';
const { success, paginated } = shared('utils/response');
@Controller('api/system/notifications')
@UseGuards(IdentityGuard)
export class EmailController {
    constructor(private readonly service: EmailService) { }
    @Get('emails/logs')
    @IdentityRoute({ "permission": ["email", "read"], "validation": ["notification", "getEmailLogs"] })
    async getEmailLogs(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.getEmailLogs(req.query);
            paginated(res, result.logs, {
                total: result.total,
                page: result.page,
                limit: result.pageSize,
                totalPages: result.totalPages,
            }, '获取邮件记录成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('emails/send')
    @IdentityRoute({ "permission": ["email", "create"], "validation": ["notification", "sendEmail"] })
    async sendEmail(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { to, subject, html, text } = req.body;
            const result = await this.service.sendEmailWithRetry({ to, subject, html, text });
            success(res, result, '邮件发送成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('emails/send-with-template')
    @IdentityRoute({ "permission": ["email", "create"], "validation": ["notification", "sendEmailWithTemplate"] })
    async sendEmailWithTemplate(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { to, templateName, variables } = req.body;
            const result = await this.service.sendEmailWithTemplate({
                to,
                templateName,
                variables,
            });
            success(res, result, '邮件发送成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('emails/test')
    @IdentityRoute({ "permission": ["email", "create"], "validation": ["notification", "sendTestEmail"] })
    async sendTestEmail(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { toEmail } = req.body;
            const result = await this.service.sendTestEmail(toEmail);
            success(res, result, '测试邮件发送成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
}
