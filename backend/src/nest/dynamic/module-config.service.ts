import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { live, pick, requireRow, pageRows } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
import { shared } from '../compatibility/shared';
import { DbReaderService } from './db-reader.service';
const builder = () => shared('generator/config-builder');
const moduleFields = ['module_name', 'module_path', 'description', 'menu_name', 'menu_icon', 'menu_parent_id', 'menu_sort', 'enable_create', 'enable_update', 'enable_delete', 'enable_batch_delete', 'enable_export', 'enable_import', 'custom_sql', 'sql_parameters', 'sql_primary_key', 'detail_display_mode', 'detail_url_pattern', 'page_config'];
const fieldFields = ['field_name', 'field_type', 'field_comment', 'is_searchable', 'search_type', 'search_component', 'show_in_list', 'list_sort', 'list_width', 'list_align', 'format_type', 'format_options', 'show_in_form', 'form_component', 'form_rules', 'is_readonly', 'field_group', 'show_in_detail', 'detail_sort', 'detail_label', 'detail_component'];
function jsonData(data: any, fields: string[]) { for (const name of fields)
    if (data[name] === null)
        data[name] = Prisma.DbNull; return data; }
@Injectable()
export class ModuleConfigService {
    constructor(private readonly db: PrismaService, private readonly reader: DbReaderService) { }
    private async fields(row: any, db: any = this.db) { return row ? { ...row, fields: await db.owl_generated_fields.findMany({ where: { module_id: row.id, ...live }, orderBy: { list_sort: 'asc' } }) } : null; }
    async getModuleConfigs(query: any) { const where: any = {}; for (const key of ['table_name', 'module_name'])
        if (query[key])
            where[key] = { contains: query[key], mode: 'insensitive' }; const result = await pageRows(this.db.owl_generated_modules, query, where, ['module_name', 'table_name'], 'created_at', 'DESC'); return { ...result, data: await Promise.all(result.data.map((row: any) => this.fields(row))) }; }
    async getModuleConfigById(id: string, options: any = {}) { const db = options.transaction || this.db; return this.fields(await requireRow(db.owl_generated_modules, id, '模块配置'), db); }
    async getModuleConfigByTableName(tableName: string, options: any = {}) { const db = options.transaction || this.db; return this.fields(await db.owl_generated_modules.findFirst({ where: { table_name: tableName, ...live } }), db); }
    async getModuleConfigByPath(path: string) { const row = await this.db.owl_generated_modules.findFirst({ where: { module_path: path.replace(/^\//, ''), ...live } }); if (!row)
        throw new NotFoundException('模块配置不存在'); return this.fields(row); }
    async initializeModuleConfig(tableName: string, options: any = {}): Promise<any> {
        if (!options.transaction)
            return this.db.$transaction(tx => this.initializeModuleConfig(tableName, { ...options, transaction: tx }));
        const db = options.transaction;
        if (!await this.reader.tableExists(tableName, options))
            throw new NotFoundException(`表 ${tableName} 不存在`);
        if (await this.getModuleConfigByTableName(tableName, options))
            throw new BadRequestException(`表 ${tableName} 已经存在配置`);
        const structure = await this.reader.getTableStructure(tableName, options);
        this.validateTimestamps(tableName, structure.columns);
        const name = tableName.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join('');
        const row = await db.owl_generated_modules.create({ data: { table_name: tableName, module_name: name, module_path: tableName.replace(/_/g, '-'), description: structure.comment || name, enable_import: true, created_by: options.userId || null } });
        const helpers = shared('generator/template-helpers');
        await db.owl_generated_fields.createMany({ data: structure.columns.map((col: any, index: number) => ({ module_id: row.id, field_name: col.name, field_type: col.type, field_comment: col.comment || col.name, is_searchable: !helpers.isSystemField(col.name) && col.name !== 'id', search_type: helpers.getDefaultSearchType(col.type), search_component: helpers.getSearchComponent(col.type), show_in_list: !['created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by'].includes(col.name), list_sort: index + 1, format_type: helpers.getFormatType(col.type, col.name), show_in_form: !helpers.isSystemField(col.name), form_component: helpers.getFormComponent(col.type), created_by: options.userId || null })) });
        return this.getModuleConfigById(row.id, options);
    }
    validateTimestamps(tableName: string, columns: any[]) { const missing = ['created_at', 'updated_at'].filter(name => !columns.some(col => col.name === name)); if (missing.length)
        throw new BadRequestException(`表 "${tableName}" 缺少必需的时间戳字段: ${missing.join(', ')}`); }
    async saveModuleConfig(data: any) {
        return this.db.$transaction(async (tx) => {
            const values = jsonData(pick(data, moduleFields), ['page_config', 'sql_parameters']);
            let row;
            if (data.id) {
                await requireRow(tx.owl_generated_modules, data.id, '模块配置');
                row = await tx.owl_generated_modules.update({ where: { id: data.id }, data: { ...values, updatedAt: new Date() } });
            }
            else {
                if (!data.table_name)
                    throw new BadRequestException('表名不能为空');
                if (await this.getModuleConfigByTableName(data.table_name, { transaction: tx }))
                    throw new BadRequestException(`表 ${data.table_name} 已经存在配置`);
                row = await tx.owl_generated_modules.create({ data: { ...values, table_name: data.table_name, module_name: data.module_name, module_path: data.module_path } });
            }
            if (Array.isArray(data.fields)) {
                const structure = await this.reader.getTableStructure(row.table_name, { transaction: tx });
                await tx.owl_generated_fields.updateMany({ where: { module_id: row.id, ...live }, data: deleted() });
                for (const [index, field] of data.fields.entries()) {
                    const col = structure.columns.find((c: any) => c.name === field.field_name);
                    const values = jsonData(pick(field, fieldFields), ['format_options', 'form_rules']);
                    await tx.owl_generated_fields.create({ data: { ...values, module_id: row.id, field_name: field.field_name, field_type: col?.type || field.field_type, list_sort: field.list_sort || index + 1, list_width: field.list_width == null ? null : String(field.list_width) } });
                }
                const config = await this.getModuleConfigById(row.id, { transaction: tx });
                await tx.owl_generated_modules.update({ where: { id: row.id }, data: { page_config: builder().buildPageConfig(config, config.fields) } });
            }
            return this.getModuleConfigById(row.id, { transaction: tx });
        });
    }
    async removeMenu(config: any, tx: any) {
        const menus = await tx.owl_menus.findMany({ where: { path: `/${config.module_path}`, ...live } }), permissions = await tx.owl_permissions.findMany({ where: { resource: config.module_path, ...live } });
        await tx.owl_role_menus.updateMany({ where: { menu_id: { in: menus.map((r: any) => r.id) }, ...live }, data: deleted() });
        await tx.owl_menus.updateMany({ where: { id: { in: menus.map((r: any) => r.id) }, ...live }, data: deleted() });
        await tx.owl_role_permissions.updateMany({ where: { permission_id: { in: permissions.map((r: any) => r.id) }, ...live }, data: deleted() });
        await tx.owl_permissions.updateMany({ where: { id: { in: permissions.map((r: any) => r.id) }, ...live }, data: deleted() });
    }
    async deleteModuleConfig(id: string) { await this.db.$transaction(async (tx) => { const config = await this.getModuleConfigById(id, { transaction: tx }); await this.removeMenu(config, tx); await tx.owl_generated_modules.update({ where: { id }, data: deleted() }); }); return { message: '模块配置删除成功' }; }
    async getFullPageConfig(id: string) { const config = await this.getModuleConfigById(id); return config.page_config || builder().buildPageConfig(config, config.fields); }
    async updatePageConfig(id: string, pageConfig: any) { await this.getModuleConfigById(id); if (!builder().validatePageConfig(pageConfig))
        throw new BadRequestException('Invalid page config'); return this.db.owl_generated_modules.update({ where: { id }, data: { page_config: pageConfig, updatedAt: new Date() } }); }
}
