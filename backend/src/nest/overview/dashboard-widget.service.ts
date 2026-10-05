import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live, pick, requireRow } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
import { SqlService } from '../dynamic/sql.service';
@Injectable()
export class DashboardWidgetService {
    constructor(private readonly db: PrismaService, private readonly sql: SqlService) { }
    validateSql(sql: string) { if (typeof sql !== 'string' || !sql.trim().toUpperCase().startsWith('SELECT'))
        throw new BadRequestException('SQL 只允许以 SELECT 开头'); if (/\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXEC|EXECUTE)\b/i.test(sql))
        throw new BadRequestException('SQL 包含不允许的操作关键字'); }
    private data(body: any) { return pick(body, ['title', 'widget_type', 'chart_type', 'sql_query', 'x_key', 'data_key', 'unit', 'sort_order', 'enabled']); }
    getAll() { return this.db.owl_dashboard_widgets.findMany({ where: live, orderBy: [{ sort_order: 'asc' }, { createdAt: 'asc' }] }); }
    getEnabled() { return this.db.owl_dashboard_widgets.findMany({ where: { enabled: true, ...live }, orderBy: [{ sort_order: 'asc' }, { createdAt: 'asc' }] }); }
    getById(id: string) { return requireRow(this.db.owl_dashboard_widgets, id, 'Widget'); }
    create(body: any, userId: string) { this.validateSql(body.sql_query); return this.db.owl_dashboard_widgets.create({ data: { ...this.data(body), title: body.title, sql_query: body.sql_query, created_by: userId } }); }
    async update(id: string, body: any) { await this.getById(id); if (body.sql_query)
        this.validateSql(body.sql_query); return this.db.owl_dashboard_widgets.update({ where: { id }, data: { ...this.data(body), updatedAt: new Date() } }); }
    async delete(id: string) { await this.getById(id); await this.db.owl_dashboard_widgets.update({ where: { id }, data: deleted() }); return { id }; }
    async executeWidget(id: string) { const widget = await this.getById(id); this.validateSql(widget.sql_query); return { widget, data: await this.sql.rows(widget.sql_query) }; }
    async executeAllEnabled() { return Promise.all((await this.getEnabled()).map(async (widget) => { try {
        return { widget, data: await this.sql.rows(widget.sql_query), error: null };
    }
    catch (error: any) {
        return { widget, data: [], error: error.message };
    } })); }
}
