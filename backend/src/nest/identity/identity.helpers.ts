import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
export type IdentityDb = Prisma.TransactionClient;
export const live = { deletedAt: null };
export const pick = (row: any, fields: string[]) => Object.fromEntries(fields.filter(key => row[key] !== undefined).map(key => [key, row[key]]));
export function safeUser(user: any) { const { password, ...safe } = user; return safe; }
export function buildTree(rows: any[], parent: string | null = null, visited = new Set<string>()): any[] {
    return rows.filter(row => row.parent_id === parent && !visited.has(row.id)).sort((a, b) => (a.sort || 0) - (b.sort || 0)).map(row => ({ ...row, children: buildTree(rows, row.id, new Set([...visited, row.id])) }));
}
export function grantedMenuTree(rows: any[], granted: string[]) {
    const visible = new Map(rows.filter(row => row.visible && row.status === 'active' && !row.deletedAt).map(row => [row.id, row]));
    const selected = new Set<string>();
    for (const id of granted) {
        let current = visible.get(id);
        while (current && !selected.has(current.id)) {
            selected.add(current.id);
            current = visible.get(current.parent_id);
        }
    }
    const tree = buildTree([...visible.values()].filter(row => selected.has(row.id)));
    return { businessMenus: tree.filter(row => row.menu_type !== 'system'), systemMenus: tree.filter(row => row.menu_type === 'system') };
}
export async function requireRow(model: any, id: string, name: string) {
    const row = await model.findFirst({ where: { id, ...live } });
    if (!row)
        throw new NotFoundException(`${name}不存在`);
    return row;
}
export async function ensureUnique(model: any, fields: Record<string, any>, labels: Record<string, string>, id?: string) {
    for (const [field, value] of Object.entries(fields)) {
        if (value && await model.findFirst({ where: { [field]: value, ...live, ...(id ? { id: { not: id } } : {}) } }))
            throw new BadRequestException(labels[field]);
    }
}
export async function validateIds(model: any, ids: string[] | undefined, label: string) {
    if (ids && await model.count({ where: { id: { in: ids }, ...live } }) !== ids.length)
        throw new BadRequestException(`部分${label}不存在`);
}
export async function pageRows(model: any, query: any, where: any, fields: string[], defaultSort: string, defaultOrder: string) {
    const page = Number(query.page || 1), limit = Number(query.limit || 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 1000)
        throw new BadRequestException('分页参数不合法');
    const sort = [...fields, 'created_at', 'updated_at', 'id'].includes(query.sort) ? query.sort : defaultSort;
    const key = sort === 'created_at' ? 'createdAt' : sort === 'updated_at' ? 'updatedAt' : sort;
    const order = String(query.order || defaultOrder).toUpperCase() === 'ASC' ? 'asc' : 'desc';
    const [total, data] = await Promise.all([model.count({ where: { ...where, ...live } }), model.findMany({ where: { ...where, ...live }, take: limit, skip: (page - 1) * limit, orderBy: { [key]: order } })]);
    return { data, pagination: { total, page, pageSize: limit, totalPages: Math.ceil(total / limit) } };
}
export function searchWhere(query: any, fields: string[], filters: string[]) {
    return { ...pick(query, filters.filter(field => query[field])), ...(query.search ? { OR: fields.map(field => ({ [field]: { contains: query.search, mode: 'insensitive' } })) } : {}) };
}
export async function rolesFor(db: IdentityDb, userId: string, permissions = false) {
    const links = await db.owl_user_roles.findMany({ where: { user_id: userId, ...live } });
    const roles = await db.owl_roles.findMany({ where: { id: { in: links.map(link => link.role_id) }, ...live } });
    if (!permissions)
        return roles;
    const grants = await db.owl_role_permissions.findMany({ where: { role_id: { in: roles.map(role => role.id) }, ...live } });
    const perms = await db.owl_permissions.findMany({ where: { id: { in: grants.map(link => link.permission_id) }, ...live } });
    return roles.map(role => ({ ...role, permissions: perms.filter(perm => grants.some(link => link.role_id === role.id && link.permission_id === perm.id)) }));
}
export async function userProfile(db: IdentityDb, id: string, permissions = false, department = true) {
    const user = await requireRow(db.owl_users, id, '用户');
    const roles = await rolesFor(db, id, permissions);
    const result: any = { ...safeUser(user), roles };
    if (department)
        result.department = user.department_id ? await db.owl_departments.findFirst({ where: { id: user.department_id, ...live }, select: { id: true, name: true } }) : null;
    return result;
}
