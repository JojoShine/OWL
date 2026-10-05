import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildTree, grantedMenuTree, live, pageRows, pick, requireRow, rolesFor, searchWhere } from './identity.helpers';
import { shared } from '../compatibility/shared';
const fields = ['parent_id', 'name', 'path', 'component', 'icon', 'type', 'visible', 'sort', 'status', 'permission_code', 'menu_type'];
@Injectable()
export class MenusService {
    constructor(private readonly db: PrismaService) { }
    async getMenus(query: any) {
        const where: any = searchWhere(query, ['name', 'path'], ['type', 'status']);
        if (query.parent_id !== undefined)
            where.parent_id = query.parent_id === 'null' ? null : query.parent_id;
        const result = await pageRows(this.db.owl_menus, query, where, ['name', 'path', 'sort', 'type', 'status'], 'sort', 'ASC');
        result.data = await Promise.all(result.data.map((menu: any) => this.withRelations(menu, false)));
        return result;
    }
    async getMenuTree() { return buildTree(await this.db.owl_menus.findMany({ where: { status: 'active', ...live }, orderBy: { sort: 'asc' } })); }
    async getUserMenuTree(userId: string) {
        await requireRow(this.db.owl_users, userId, '用户');
        const roles = await rolesFor(this.db, userId);
        const links = await this.db.owl_role_menus.findMany({ where: { role_id: { in: roles.map(role => role.id) }, ...live } });
        const menus = await this.db.owl_menus.findMany({ where: { status: 'active', visible: true, ...live }, orderBy: { sort: 'asc' } });
        return grantedMenuTree(menus, links.map(link => link.menu_id));
    }
    private async withRelations(menu: any, detail: boolean) {
        const links = await this.db.owl_role_menus.findMany({ where: { menu_id: menu.id, ...live } });
        const roles = await this.db.owl_roles.findMany({ where: { id: { in: links.map(x => x.role_id) }, ...live }, ...(!detail ? { select: { id: true, name: true, code: true } } : {}) });
        const parent = menu.parent_id ? await this.db.owl_menus.findFirst({ where: { id: menu.parent_id, ...live }, select: { id: true, name: true } }) : null;
        return { ...menu, parent, roles, ...(detail ? { children: await this.db.owl_menus.findMany({ where: { parent_id: menu.id, ...live } }) } : {}) };
    }
    async getMenuById(id: string) { return this.withRelations(await requireRow(this.db.owl_menus, id, '菜单'), true); }
    private async save(body: any, id?: string) {
        const result = await this.db.$transaction(async (tx) => {
            const existing = id ? await requireRow(tx.owl_menus, id, '菜单') : null;
            if (body.parent_id) {
                let parent = await requireRow(tx.owl_menus, body.parent_id, '父菜单');
                const seen = new Set<string>();
                while (parent) {
                    if (parent.id === id || seen.has(parent.id))
                        throw new BadRequestException('不能将菜单的父级设置为自己或自己的子级');
                    seen.add(parent.id);
                    parent = parent.parent_id ? await requireRow(tx.owl_menus, parent.parent_id, '父菜单') : null;
                }
            }
            const data: any = { ...pick(body, fields), updatedAt: new Date() };
            if ((body.auto_generate_permission ?? !id) && body.path && (!existing || body.path !== existing.path)) {
                const source = { ...existing, ...body, permission_code: body.permission_code };
                const generator = shared('utils/permission-generator');
                const permissions = generator.generatePermissionsFromMenu(source);
                for (const permission of permissions || []) {
                    if (!await tx.owl_permissions.findFirst({ where: { code: permission.code, ...live } }))
                        await tx.owl_permissions.create({ data: permission });
                }
                if (permissions?.length)
                    data.permission_code = generator.getMenuPermissionCode(source);
            }
            return id ? tx.owl_menus.update({ where: { id }, data }) : tx.owl_menus.create({ data: { ...data, name: body.name, menu_type: body.menu_type || 'business' } });
        });
        return this.getMenuById(result.id);
    }
    createMenu(body: any) { return this.save(body); }
    updateMenu(id: string, body: any) { return this.save(body, id); }
    async deleteMenu(id: string) {
        await this.db.$transaction(async (tx) => {
            await requireRow(tx.owl_menus, id, '菜单');
            const count = await tx.owl_menus.count({ where: { parent_id: id, ...live } });
            if (count)
                throw new BadRequestException(`该菜单有 ${count} 个子菜单，请先删除子菜单`);
            await tx.owl_role_menus.updateMany({ where: { menu_id: id, ...live }, data: { deletedAt: new Date(), updatedAt: new Date() } });
            await tx.owl_menus.update({ where: { id }, data: { deletedAt: new Date(), updatedAt: new Date() } });
        });
        return { message: '菜单删除成功' };
    }
}
