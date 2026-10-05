import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ensureUnique, live, pageRows, pick, requireRow, searchWhere } from './identity.helpers';
@Injectable()
export class PermissionsService {
    constructor(private readonly db: PrismaService) { }
    getPermissions(query: any) { return pageRows(this.db.owl_permissions, query, searchWhere(query, ['name', 'code', 'description'], ['resource', 'action', 'category']), ['name', 'code', 'resource', 'action', 'category'], 'category', 'ASC'); }
    async getPermissionById(id: string) {
        const permission = await requireRow(this.db.owl_permissions, id, '权限');
        const links = await this.db.owl_role_permissions.findMany({ where: { permission_id: id, ...live } });
        const roles = await this.db.owl_roles.findMany({ where: { id: { in: links.map(x => x.role_id) }, ...live } });
        return { ...permission, roles };
    }
    private async save(body: any, id?: string) {
        if (id)
            await requireRow(this.db.owl_permissions, id, '权限');
        await ensureUnique(this.db.owl_permissions, pick(body, ['code']), { code: '权限代码已存在' }, id);
        const data = { ...pick(body, ['name', 'code', 'resource', 'action', 'description', 'category']), updatedAt: new Date() };
        const permission = id ? await this.db.owl_permissions.update({ where: { id }, data }) : await this.db.owl_permissions.create({ data: { ...data, name: body.name, code: body.code, resource: body.resource, action: body.action } });
        return permission;
    }
    createPermission(body: any) { return this.save(body); }
    updatePermission(id: string, body: any) { return this.save(body, id); }
    async deletePermission(id: string) {
        await this.db.$transaction(async (tx) => {
            await requireRow(tx.owl_permissions, id, '权限');
            const count = await tx.owl_role_permissions.count({ where: { permission_id: id, ...live } });
            if (count)
                throw new BadRequestException(`该权限被 ${count} 个角色使用，无法删除`);
            await tx.owl_permissions.update({ where: { id }, data: { deletedAt: new Date(), updatedAt: new Date() } });
        });
        return { message: '权限删除成功' };
    }
    async getAllPermissions() {
        const rows = await this.db.owl_permissions.findMany({ where: live, select: { id: true, name: true, code: true, resource: true, action: true, category: true, description: true }, orderBy: [{ category: 'asc' }, { resource: 'asc' }, { action: 'asc' }] });
        const groups: Record<string, any[]> = {};
        for (const row of rows) {
            const category = row.category || '其他';
            (groups[category] ||= []).push(row);
        }
        return groups;
    }
    private async distinct(field: 'resource' | 'action' | 'category') {
        const rows = await this.db.owl_permissions.findMany({ where: { ...live, ...(field === 'category' ? { category: { not: null } } : {}) }, distinct: [field], orderBy: { [field]: 'asc' } });
        return rows.map(row => row[field]);
    }
    getResources() { return this.distinct('resource'); }
    getActions() { return this.distinct('action'); }
    getCategories() { return this.distinct('category'); }
}
