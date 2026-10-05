import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live } from '../identity/identity.helpers';
import { shared } from '../compatibility/shared';
import { ModuleConfigService } from './module-config.service';
import { DbReaderService } from './db-reader.service';
import { SqlService } from './sql.service';
import { quoteId, quoteLiteral } from './business-table.service';
const auditFields = [{ name: 'created_at', type: 'timestamp with time zone', comment: '创建时间' }, { name: 'updated_at', type: 'timestamp with time zone', comment: '更新时间' }, { name: 'deleted_at', type: 'timestamp with time zone', comment: '软删除时间' }, { name: 'created_by', type: 'uuid', comment: '创建者ID' }, { name: 'updated_by', type: 'uuid', comment: '更新者ID' }, { name: 'deleted_by', type: 'uuid', comment: '删除者ID' }];
@Injectable()
export class CodeGeneratorService {
    constructor(private readonly db: PrismaService, private readonly configs: ModuleConfigService, private readonly reader: DbReaderService, private readonly sql: SqlService) { }
    async generateCode(id: string, options: any = {}) {
        const config = await this.db.$transaction(async (tx) => {
            const config = await this.configs.getModuleConfigById(id, { transaction: tx });
            const table = await this.reader.getTableStructure(config.table_name, { transaction: tx });
            this.configs.validateTimestamps(config.table_name, table.columns);
            if (options.generateFrontend !== false)
                await tx.owl_generated_modules.update({ where: { id }, data: { page_config: shared('generator/config-builder').buildPageConfig(config, config.fields), updatedAt: new Date() } });
            const path = `/${config.module_path}`;
            if (!await tx.owl_menus.findFirst({ where: { path, ...live } })) {
                const menu = await tx.owl_menus.create({ data: { name: config.menu_name || config.description || config.module_name, path, icon: config.menu_icon || 'FileText', sort: config.menu_sort || 100, parent_id: config.menu_parent_id || null, visible: true, status: 'active', type: 'menu' } });
                const permissions = [];
                for (const [action, label] of [['read', '查看'], ['create', '创建'], ['update', '更新'], ['delete', '删除']]) {
                    const code = `${config.module_path}:${action}`;
                    const existing = await tx.owl_permissions.findFirst({ where: { code } });
                    permissions.push(existing ? await tx.owl_permissions.update({ where: { id: existing.id }, data: { deletedAt: null, updatedAt: new Date() } }) : await tx.owl_permissions.create({ data: { code, resource: config.module_path, action, name: `${label}${config.description}`, description: `${label}${config.description}` } }));
                }
                const roles = await tx.owl_roles.findMany({ where: { code: { in: ['admin', 'super_admin'] }, ...live } });
                for (const role of roles) {
                    await tx.owl_role_menus.create({ data: { role_id: role.id, menu_id: menu.id } });
                    for (const permission of permissions) {
                        const existing = await tx.owl_role_permissions.findFirst({ where: { role_id: role.id, permission_id: permission.id } });
                        if (existing)
                            await tx.owl_role_permissions.update({ where: { id: existing.id }, data: { deletedAt: null, updatedAt: new Date() } });
                        else
                            await tx.owl_role_permissions.create({ data: { role_id: role.id, permission_id: permission.id } });
                    }
                }
            }
            return config;
        });
        shared('notification/socket').broadcast('menu:updated', { action: 'create', moduleName: config.module_name, menuPath: config.module_path });
        return { success: true, moduleName: config.module_name, modulePath: config.module_path, configDriven: true, filesGenerated: 0, message: '配置驱动架构 - 无需生成文件，零重启！' };
    }
    async deleteGeneratedCode(id: string) {
        await this.db.$transaction(async (tx) => {
            const config = await this.configs.getModuleConfigById(id, { transaction: tx });
            // Current modules generate no files. Historical file artifacts require explicit cleanup.
            if (Array.isArray(config.generated_files) && config.generated_files.length)
                throw new BadRequestException('此模块包含旧版生成文件，请先清理旧版文件后再撤销发布');
            await this.configs.removeMenu(config, tx);
            await tx.owl_generated_modules.update({ where: { id }, data: { generated_files: [], updatedAt: new Date() } });
        });
        return { message: '模块删除成功（配置驱动）', filesDeleted: 0, configDriven: true };
    }
    async checkAuditFields(tableName: string, tx?: any) { const columns = await this.sql.rows("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=:tableName", { tableName }, tx); return { missingFields: auditFields.filter(field => !columns.some(col => col.column_name === field.name)), existingFields: auditFields.filter(field => columns.some(col => col.column_name === field.name)), allFields: auditFields }; }
    async addAuditFields(tableName: string) {
        return this.db.$transaction(async (tx) => {
            if (!await this.reader.tableExists(tableName, { transaction: tx }))
                throw new NotFoundException(`表 "${tableName}" 不存在`);
            const { missingFields } = await this.checkAuditFields(tableName, tx);
            for (const field of missingFields) {
                await this.sql.execute(`ALTER TABLE ${quoteId(tableName)} ADD COLUMN ${quoteId(field.name)} ${field.type}${['created_at', 'updated_at'].includes(field.name) ? ' NOT NULL DEFAULT CURRENT_TIMESTAMP' : ''}`, {}, tx);
                await this.sql.execute(`COMMENT ON COLUMN ${quoteId(tableName)}.${quoteId(field.name)} IS ${quoteLiteral(field.comment)}`, {}, tx);
            }
            return { addedFields: missingFields.map(field => field.name), message: missingFields.length ? `成功添加 ${missingFields.length} 个审计字段: ${missingFields.map(field => field.name).join(', ')}` : '所有审计字段已存在，无需添加' };
        });
    }
}
