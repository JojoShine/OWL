import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live, pick, requireRow } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
import { shared } from '../compatibility/shared';
const handlebars = require('handlebars');
@Injectable()
export class EmailTemplatesService {
    constructor(private readonly db: PrismaService) { }
    async getAllTemplates(options: any = {}) {
        const page = Number(options.page) || 1, limit = Number(options.limit) || 20;
        const where = { ...live, ...(options.keyword ? { name: { contains: options.keyword, mode: 'insensitive' as const } } : {}) };
        const [templates, total] = await Promise.all([this.db.owl_email_templates.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }), this.db.owl_email_templates.count({ where })]);
        return { templates, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
    }
    getTemplateById(id: string) { return requireRow(this.db.owl_email_templates, id, '邮件模板'); }
    async getTemplateByName(name: string) { const row = await this.db.owl_email_templates.findFirst({ where: { name, ...live } }); if (!row)
        throw new NotFoundException('邮件模板不存在'); return row; }
    private async unique(name: string, id?: string) { if (await this.db.owl_email_templates.findFirst({ where: { name, ...live, ...(id ? { id: { not: id } } : {}) } }))
        throw new BadRequestException(`模板名称已存在: ${name}`); }
    async createTemplate(body: any) { await this.unique(body.name); return this.db.owl_email_templates.create({ data: { name: body.name, subject: body.subject, content: body.content, variables: {}, variable_schema: [], tags: body.tags || [], description: body.description || null } }); }
    async updateTemplate(id: string, body: any) { await this.getTemplateById(id); if (body.name)
        await this.unique(body.name, id); return this.db.owl_email_templates.update({ where: { id }, data: { ...pick(body, ['name', 'subject', 'content', 'tags', 'description']), updatedAt: new Date() } }); }
    async deleteTemplate(id: string) { await this.getTemplateById(id); await this.db.owl_email_templates.update({ where: { id }, data: deleted() }); return true; }
    private render(template: any, variables: any) { return { subject: handlebars.compile(template.subject)(variables), content: handlebars.compile(template.content)(variables) }; }
    async renderTemplate(id: string, variables: any = {}) { return this.render(await this.getTemplateById(id), { title: variables.title || '系统告警通知', content: variables.content || '<p>暂无详细内容</p>' }); }
    async renderTemplateByName(name: string, variables: any = {}) { return this.render(await this.getTemplateByName(name), variables); }
    validateTemplateSyntax(subject: string, content: string) { handlebars.parse(subject); handlebars.parse(content); return true; }
    ensureAllowedPlaceholders(subject: string, content: string) { return new (shared('utils/email-template-validation'))().ensureAllowedPlaceholders(subject, content); }
    async validateTemplateVariables(id: string, variables: any = {}) { await this.getTemplateById(id); const missingVariables = ['title', 'content'].filter(key => !variables[key]); return { valid: missingVariables.length === 0, missingVariables }; }
    async previewTemplate(id: string, variables: any = {}) { const rendered = await this.renderTemplate(id, { title: variables.title || '接口监控告警示例', content: variables.content || '<p>这里展示告警详情内容示例。</p>' }); return { ...rendered, html: rendered.content }; }
}
