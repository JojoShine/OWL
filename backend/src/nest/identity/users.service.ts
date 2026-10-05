import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ensureUnique, live, pageRows, pick, requireRow, rolesFor, safeUser, searchWhere, userProfile, validateIds } from './identity.helpers';
const bcrypt = require('bcryptjs');
const fields = ['username', 'email', 'real_name', 'phone', 'avatar', 'status', 'access_level', 'department_id'];
@Injectable()
export class UsersService {
    constructor(private readonly db: PrismaService) { }
    async getUsers(query: any) {
        const where: any = searchWhere(query, ['username', 'email', 'real_name'], ['status']);
        if (query.role_id) {
            const links = await this.db.owl_user_roles.findMany({ where: { role_id: query.role_id, ...live } });
            const role = await this.db.owl_roles.findFirst({ where: { id: query.role_id, ...live } });
            where.id = { in: role ? links.map(link => link.user_id) : [] };
        }
        const result = await pageRows(this.db.owl_users, query, where, ['username', 'email', 'status', 'department_id', 'access_level'], 'created_at', 'DESC');
        result.data = await Promise.all(result.data.map(async (user: any) => ({ ...safeUser(user), roles: (await rolesFor(this.db, user.id)).filter(role => !query.role_id || role.id === query.role_id) })));
        return result;
    }
    getUserById(id: string) { return userProfile(this.db, id, false, false); }
    async createUser(body: any) {
        const user = await this.db.$transaction(async (tx) => {
            await ensureUnique(tx.owl_users, pick(body, ['username', 'email', 'phone']), { username: '用户名已存在', email: '邮箱已被注册', phone: '手机号已被注册' });
            await validateIds(tx.owl_roles, body.role_ids, '角色');
            const now = new Date();
            const user = await tx.owl_users.create({ data: { ...pick(body, fields), username: body.username, email: body.email, password: body.password ? await bcrypt.hash(body.password, 10) : null, createdAt: now, updatedAt: now } });
            if (body.role_ids?.length)
                await tx.owl_user_roles.createMany({ data: body.role_ids.map((role_id: string) => ({ user_id: user.id, role_id })) });
            return user;
        });
        return this.getUserById(user.id);
    }
    async updateUser(id: string, body: any) {
        await this.db.$transaction(async (tx) => {
            await requireRow(tx.owl_users, id, '用户');
            await ensureUnique(tx.owl_users, pick(body, ['username', 'email', 'phone']), { username: '用户名已存在', email: '邮箱已被注册', phone: '手机号已被注册' }, id);
            await validateIds(tx.owl_roles, body.role_ids, '角色');
            const data: any = { ...pick(body, fields), updatedAt: new Date() };
            if (body.password)
                data.password = await bcrypt.hash(body.password, 10);
            await tx.owl_users.update({ where: { id }, data });
            if (body.role_ids !== undefined) {
                await tx.owl_user_roles.updateMany({ where: { user_id: id, ...live }, data: { deletedAt: new Date(), updatedAt: new Date() } });
                if (body.role_ids.length)
                    await tx.owl_user_roles.createMany({ data: body.role_ids.map((role_id: string) => ({ user_id: id, role_id })) });
            }
        });
        return this.getUserById(id);
    }
    async deleteUser(id: string) {
        await requireRow(this.db.owl_users, id, '用户');
        await this.db.owl_users.update({ where: { id }, data: { deletedAt: new Date(), updatedAt: new Date() } });
        return { message: '用户删除成功' };
    }
    async resetPassword(id: string, password: string) {
        await requireRow(this.db.owl_users, id, '用户');
        await this.db.owl_users.update({ where: { id }, data: { password: await bcrypt.hash(password, 10), updatedAt: new Date() } });
        return { message: '密码重置成功' };
    }
}
