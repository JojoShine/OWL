import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ensureUnique, live, pageRows, pick, requireRow, searchWhere, validateIds } from './identity.helpers';
@Injectable()
export class RolesService {
    constructor(private readonly db: PrismaService) { }
    getRoles(query: any) { return pageRows(this.db.owl_roles, query, searchWhere(query, ['name', 'code', 'description'], ['status']), ['name', 'code', 'sort', 'status'], 'sort', 'ASC'); }
    async getRoleById(id: string) {
        const role = await requireRow(this.db.owl_roles, id, '角色');
        const [permissionLinks, menuLinks] = await Promise.all([
            this.db.owl_role_permissions.findMany({ where: { role_id: id, ...live } }),
            this.db.owl_role_menus.findMany({ where: { role_id: id, ...live } }),
        ]);
        const [permissions, menus] = await Promise.all([
            this.db.owl_permissions.findMany({ where: { id: { in: permissionLinks.map(x => x.permission_id) }, ...live }, select: { id: true, name: true, code: true, category: true } }),
            this.db.owl_menus.findMany({ where: { id: { in: menuLinks.map(x => x.menu_id) }, ...live }, select: { id: true, name: true, path: true, icon: true } }),
        ]);
        return { ...role, permissions, menus };
    }
    private async save(body: any, id?: string) {
        const role = await this.db.$transaction(async (tx) => {
            if (id)
                await requireRow(tx.owl_roles, id, '角色');
            await ensureUnique(tx.owl_roles, pick(body, ['name', 'code']), { name: '角色名称已存在', code: '角色代码已存在' }, id);
            await validateIds(tx.owl_permissions, body.permission_ids, '权限');
            await validateIds(tx.owl_menus, body.menu_ids, '菜单');
            const data = { ...pick(body, ['name', 'code', 'description', 'status', 'sort']), updatedAt: new Date() };
            const role = id ? await tx.owl_roles.update({ where: { id }, data }) : await tx.owl_roles.create({ data: { ...data, name: body.name, code: body.code } });
            if (body.permission_ids !== undefined) {
                await tx.owl_role_permissions.updateMany({ where: { role_id: role.id, ...live }, data: { deletedAt: new Date(), updatedAt: new Date() } });
                if (body.permission_ids.length)
                    await tx.owl_role_permissions.createMany({ data: body.permission_ids.map((permission_id: string) => ({ role_id: role.id, permission_id })) });
            }
            if (body.menu_ids !== undefined) {
                await tx.owl_role_menus.updateMany({ where: { role_id: role.id, ...live }, data: { deletedAt: new Date(), updatedAt: new Date() } });
                if (body.menu_ids.length)
                    await tx.owl_role_menus.createMany({ data: body.menu_ids.map((menu_id: string) => ({ role_id: role.id, menu_id })) });
            }
            return role;
        });
        return this.getRoleById(role.id);
    }
    createRole(body: any) { return this.save(body); }
    updateRole(id: string, body: any) { return this.save(body, id); }
    async deleteRole(id: string) {
        await this.db.$transaction(async (tx) => {
            await requireRow(tx.owl_roles, id, '角色');
            const count = await tx.owl_user_roles.count({ where: { role_id: id, ...live } });
            if (count)
                throw new BadRequestException(`该角色被 ${count} 个用户使用，无法删除`);
            await tx.owl_role_permissions.updateMany({ where: { role_id: id, ...live }, data: { deletedAt: new Date(), updatedAt: new Date() } });
            await tx.owl_role_menus.updateMany({ where: { role_id: id, ...live }, data: { deletedAt: new Date(), updatedAt: new Date() } });
            await tx.owl_roles.update({ where: { id }, data: { deletedAt: new Date(), updatedAt: new Date() } });
        });
        return { message: '角色删除成功' };
    }
    getAllRoles() { return this.db.owl_roles.findMany({ where: { status: 'active', ...live }, select: { id: true, name: true, code: true, description: true }, orderBy: { sort: 'asc' } }); }
}
