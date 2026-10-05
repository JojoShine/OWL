import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live, pick, pageRows } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
@Injectable()
export class GenerationHistoryService {
    constructor(private readonly db: PrismaService) { }
    recordHistory(data: any) { return this.db.owl_generation_history.create({ data: { ...pick(data, ['module_id', 'table_name', 'module_name', 'operation_type', 'success', 'error_message']), files_generated: data.files_generated || [], generated_by: data.user_id } }); }
    private async module(row: any, full = false) { return row ? { ...row, module: row.module_id ? await this.db.owl_generated_modules.findFirst({ where: { id: row.module_id, ...live }, ...(full ? {} : { select: { id: true, module_name: true, table_name: true, description: true } }) }) : null } : null; }
    async getHistoryList(query: any) { const where: any = pick(query, ['module_id', 'operation_type']); if (query.success !== undefined)
        where.success = query.success === true || query.success === 'true'; const result = await pageRows(this.db.owl_generation_history, query, where, ['module_name', 'table_name', 'operation_type', 'success'], 'created_at', 'DESC'); return { ...result, data: await Promise.all(result.data.map((row: any) => this.module(row))) }; }
    async getHistoryById(id: string) { return this.module(await this.db.owl_generation_history.findFirst({ where: { id, ...live } }), true); }
    getModuleHistory(moduleId: string, query: any = {}) { return this.getHistoryList({ ...query, module_id: moduleId }); }
    async getStatistics(options: any = {}) { const where: any = { ...live }; if (options.start_date || options.end_date)
        where.createdAt = { ...(options.start_date ? { gte: new Date(options.start_date) } : {}), ...(options.end_date ? { lte: new Date(options.end_date) } : {}) }; const [total, success, failure, groups, rows] = await Promise.all([this.db.owl_generation_history.count({ where }), this.db.owl_generation_history.count({ where: { ...where, success: true } }), this.db.owl_generation_history.count({ where: { ...where, success: false } }), this.db.owl_generation_history.groupBy({ by: ['operation_type'], where, _count: true }), this.db.owl_generation_history.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10 })]); return { total, success, failure, successRate: total ? (success / total * 100).toFixed(2) : 0, byOperationType: groups.map(row => ({ type: row.operation_type, count: row._count })), recentGenerations: await Promise.all(rows.map(row => this.module(row))) }; }
    async cleanupOldHistory(days = 30) { const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days); const { count } = await this.db.owl_generation_history.updateMany({ where: { createdAt: { lt: cutoff }, ...live }, data: deleted() }); return { message: `已清理 ${count} 条历史记录`, deletedCount: count }; }
}
