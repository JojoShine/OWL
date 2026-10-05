import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { EmailTemplatesService } from './templates.service';
const { success, paginated } = shared('utils/response');
@Controller('api/system/notifications')
@UseGuards(IdentityGuard)
export class EmailTemplateController {
    constructor(private readonly service: EmailTemplatesService) { }
    @Get('emails/templates')
    @IdentityRoute({ "permission": ["email_template", "read"] })
    async getTemplates(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.getAllTemplates(req.query);
            paginated(res, result.templates, {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages,
            }, '获取模板列表成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('emails/templates')
    @IdentityRoute({ "permission": ["email_template", "create"], "validation": ["notification", "createEmailTemplate"] })
    async createTemplate(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const template = await this.service.createTemplate(req.body);
            success(res, template, '创建模板成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('emails/templates/:id')
    @IdentityRoute({ "permission": ["email_template", "read"] })
    async getTemplateById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const template = await this.service.getTemplateById(req.params.id);
            success(res, template, '获取模板详情成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put('emails/templates/:id')
    @IdentityRoute({ "permission": ["email_template", "update"], "validation": ["notification", "updateEmailTemplate"] })
    async updateTemplate(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const template = await this.service.updateTemplate(req.params.id, req.body);
            success(res, template, '更新模板成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete('emails/templates/:id')
    @IdentityRoute({ "permission": ["email_template", "delete"], "validation": ["notification", "deleteEmailTemplate"] })
    async deleteTemplate(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            await this.service.deleteTemplate(req.params.id);
            success(res, null, '删除模板成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('emails/templates/:id/preview')
    @IdentityRoute({ "permission": ["email_template", "read"], "validation": ["notification", "previewEmailTemplate"] })
    async previewTemplate(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const preview = await this.service.previewTemplate(req.params.id, {
                title: req.body.title,
                content: req.body.content,
            });
            success(res, preview, '预览模板成功');
        }
        catch (error: any) {
            throw error;
        }
    }
}
