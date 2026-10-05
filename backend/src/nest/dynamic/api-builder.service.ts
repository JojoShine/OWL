import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { live, pick, requireRow } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
import { shared } from '../compatibility/shared';
import { SqlService } from './sql.service';
@Injectable()
export class ApiBuilderService extends shared('utils/sql-validation') {
    constructor(private readonly db: PrismaService, private readonly sql: SqlService) { super(); }
    private data(body: any) { const result = pick(body, ['name', 'description', 'sql_query', 'method', 'endpoint', 'version', 'parameters', 'status', 'require_auth', 'rate_limit']); if (result.parameters === null)
        result.parameters = Prisma.DbNull; return result; }
    async createInterface(body: any, userId: string) { try {
        return await this.db.owl_api_interfaces.create({ data: { ...this.data(body), name: body.name, sql_query: body.sql_query, endpoint: body.endpoint, method: body.method || 'GET', version: body.version || 1, require_auth: body.require_auth !== false, rate_limit: body.rate_limit || 1000, created_by: userId } });
    }
    catch (error: any) {
        if (error.code === 'P2002')
            throw new BadRequestException('接口端点及版本已存在');
        throw error;
    } }
    private async creator(row: any) { return { ...row, creator: await this.db.owl_users.findFirst({ where: { id: row.created_by, ...live }, select: { id: true, username: true, real_name: true } }) }; }
    async getInterfaces(query: any) { const page = Number(query.page) || 1, limit = Number(query.limit) || 10; const where: any = { ...live }; if (query.status)
        where.status = query.status; if (query.search)
        where.OR = ['name', 'endpoint'].map(key => ({ [key]: { contains: query.search, mode: 'insensitive' } })); const [rows, total] = await Promise.all([this.db.owl_api_interfaces.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }), this.db.owl_api_interfaces.count({ where })]); return { items: await Promise.all(rows.map(row => this.creator(row))), pagination: { page, limit, total, pages: Math.ceil(total / limit) } }; }
    async getInterfaceById(id: string) { const row = await requireRow(this.db.owl_api_interfaces, id, '接口'); const links = await this.db.owl_api_key_interfaces.findMany({ where: { interface_id: id, ...live } }); return { ...await this.creator(row), keys: await this.db.owl_api_keys.findMany({ where: { id: { in: links.map(link => link.api_key_id) }, ...live }, select: { id: true, client_name: true, key_prefix: true, status: true, expires_at: true, createdAt: true } }) }; }
    async updateInterface(id: string, body: any) { await this.getInterfaceById(id); try {
        await this.db.owl_api_interfaces.update({ where: { id }, data: { ...this.data(body), updatedAt: new Date() } });
        return this.getInterfaceById(id);
    }
    catch (error: any) {
        if (error.code === 'P2002')
            throw new BadRequestException('接口端点及版本已存在');
        throw error;
    } }
    async deleteInterface(id: string) { await this.getInterfaceById(id); await this.db.owl_api_interfaces.update({ where: { id }, data: deleted() }); return { message: '接口已删除' }; }
    async findInterface(endpoint: string, version: number, method: string) { const row = await this.db.owl_api_interfaces.findFirst({ where: { endpoint, version, status: 'active', ...live } }); if (!row)
        throw new NotFoundException(`接口不存在: ${endpoint} v${version}`); if (row.method !== method)
        throw new BadRequestException(`接口不支持 ${method} 方法，仅支持 ${row.method}`); return row; }
    private async runSql(query: string, params: any, test: boolean) {
        try {
            if (!query?.trim())
                throw new BadRequestException('SQL语句不能为空');
            const operationType = this.validateSqlSafety(query);
            this.validateParameters(params);
            if (operationType === 'SELECT') {
                const rows = await this.sql.rows(query, params);
                return { success: true, operationType, columns: rows.length ? Object.keys(rows[0]).map(name => ({ name, type: typeof rows[0][name] })) : [], rowCount: rows.length, ...(test ? { sample: rows.slice(0, 5) } : { data: rows }) };
            }
            const affectedRows = await this.sql.execute(query, params);
            return { success: true, operationType, affectedRows, message: `${operationType} 操作成功${test ? '' : `，受影响行数: ${affectedRows}`}` };
        }
        catch (error: any) {
            if (error.statusCode || error.status)
                throw error;
            throw new BadRequestException(`SQL执行失败: ${error.message}`);
        }
    }
    testSql(query: string, params: any = {}) { return this.runSql(query, params, true); }
    executeSql(query: string, params: any = {}) { return this.runSql(query, params, false); }
}
