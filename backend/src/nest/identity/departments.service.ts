import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildTree, ensureUnique, live, pageRows, pick, requireRow, rolesFor, searchWhere } from './identity.helpers';
@Injectable()
export class DepartmentsService {
    constructor(private readonly db: PrismaService) { }
    private async withRelations(row: any, detail = false) {
        const parent = row.parent_id ? await this.db.owl_departments.findFirst({ where: { id: row.parent_id, ...live }, select: { id: true, name: true } }) : null;
        const leader = row.leader_id ? await this.db.owl_users.findFirst({ where: { id: row.leader_id, ...live }, select: { id: true, username: true, real_name: true, ...(detail ? { email: true, phone: true } : {}) } }) : null;
        return { ...row, parent, leader, ...(detail ? { children: await this.db.owl_departments.findMany({ where: { parent_id: row.id, ...live } }) } : {}) };
    }
    async getDepartments(query: any) {
        const where: any = searchWhere(query, ['name', 'code'], ['status']);
        if (query.parent_id !== undefined)
            where.parent_id = query.parent_id === 'null' ? null : query.parent_id;
        const result = await pageRows(this.db.owl_departments, query, where, ['name', 'code', 'sort', 'status'], 'sort', 'ASC');
        result.data = await Promise.all(result.data.map((row: any) => this.withRelations(row)));
        return result;
    }
    async getDepartmentTree() {
        const rows = await this.db.owl_departments.findMany({ where: { status: 'active', ...live }, orderBy: { sort: 'asc' } });
        return buildTree(await Promise.all(rows.map(async (row) => {
            const { parent, ...result } = await this.withRelations(row);
            return result;
        })));
    }
    async getDepartmentById(id: string) { return this.withRelations(await requireRow(this.db.owl_departments, id, '部门'), true); }
    private async save(body: any, id?: string) {
        const result = await this.db.$transaction(async (tx) => {
            if (id)
                await requireRow(tx.owl_departments, id, '部门');
            if (body.parent_id) {
                let parent = await requireRow(tx.owl_departments, body.parent_id, '父部门');
                const seen = new Set<string>();
                while (parent) {
                    if (parent.id === id || seen.has(parent.id))
                        throw new BadRequestException('不能将部门的父级设置为自己或自己的子级');
                    seen.add(parent.id);
                    parent = parent.parent_id ? await requireRow(tx.owl_departments, parent.parent_id, '父部门') : null;
                }
            }
            await ensureUnique(tx.owl_departments, pick(body, ['code']), { code: '部门代码已存在' }, id);
            if (body.leader_id)
                await requireRow(tx.owl_users, body.leader_id, '负责人');
            const data = { ...pick(body, ['parent_id', 'name', 'code', 'leader_id', 'description', 'sort', 'status']), updatedAt: new Date() };
            return id ? tx.owl_departments.update({ where: { id }, data }) : tx.owl_departments.create({ data: { ...data, name: body.name } });
        });
        return this.getDepartmentById(result.id);
    }
    createDepartment(body: any) { return this.save(body); }
    updateDepartment(id: string, body: any) { return this.save(body, id); }
    async deleteDepartment(id: string) {
        await this.db.$transaction(async (tx) => {
            await requireRow(tx.owl_departments, id, '部门');
            const children = await tx.owl_departments.count({ where: { parent_id: id, ...live } });
            if (children)
                throw new BadRequestException(`该部门有 ${children} 个子部门，请先删除子部门`);
            const members = await tx.owl_users.count({ where: { department_id: id, ...live } });
            if (members)
                throw new BadRequestException(`该部门有 ${members} 名成员，请先转移成员`);
            await tx.owl_departments.update({ where: { id }, data: { deletedAt: new Date(), updatedAt: new Date() } });
        });
        return { message: '部门删除成功' };
    }
    async getDepartmentMembers(id: string, query: any = {}) {
        const department = await requireRow(this.db.owl_departments, id, '部门');
        const result = await pageRows(this.db.owl_users, query, { department_id: id, ...searchWhere(query, ['username', 'real_name'], ['status']) }, [], 'created_at', 'DESC');
        const members = await Promise.all(result.data.map(async (row: any) => ({ ...pick(row, ['id', 'username', 'real_name', 'email', 'phone', 'status']), created_at: row.createdAt, roles: (await rolesFor(this.db, row.id)).map(role => pick(role, ['id', 'name', 'code'])) })));
        return { department, members, pagination: result.pagination };
    }
}
