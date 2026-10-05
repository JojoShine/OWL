import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from './users.service';
import { IdentityEffects } from './identity.effects';
import { live, pick, requireRow, safeUser, userProfile } from './identity.helpers';
const bcrypt = require('bcryptjs');
@Injectable()
export class AuthService {
    constructor(private readonly db: PrismaService, private readonly users: UsersService, private readonly effects: IdentityEffects) { }
    async authenticate(authorization?: string) {
        const token = authorization?.replace('Bearer ', '');
        if (!token)
            throw new UnauthorizedException('未提供认证token');
        let decoded: any;
        try {
            decoded = this.effects.verifyToken(token);
        }
        catch (error: any) {
            throw new UnauthorizedException(error.name === 'TokenExpiredError' ? 'Token已过期' : 'Token无效');
        }
        if (typeof decoded?.id !== 'string' || !decoded.id)
            throw new UnauthorizedException('Token无效');
        const user = await this.db.owl_users.findFirst({ where: { id: decoded.id, ...live } });
        if (!user)
            throw new UnauthorizedException('用户不存在');
        if (user.status !== 'active')
            throw new ForbiddenException(`用户状态异常: ${user.status}`);
        return userProfile(this.db, user.id, true);
    }
    async register(body: any) {
        const role = await this.db.owl_roles.findFirst({ where: { code: 'user', ...live } });
        const user = await this.users.createUser({ ...pick(body, ['username', 'email', 'password', 'real_name', 'phone']), role_ids: role ? [role.id] : [] });
        const { roles, ...result } = user;
        return result;
    }
    async login(body: any, device: any = null, ip: string | null = null) {
        if (!await this.effects.verifyCaptcha(body.captchaId, body.captchaCode))
            throw new BadRequestException('验证码错误或已过期');
        const user = await this.db.owl_users.findFirst({ where: { username: body.username, ...live } });
        if (!user?.password || !await bcrypt.compare(body.password, user.password))
            throw new UnauthorizedException('用户名或密码错误');
        if (user.status !== 'active')
            throw new ForbiddenException(user.status === 'banned' ? '账户已被封禁' : '账户已被禁用');
        const token = this.effects.generateToken(user);
        const now = new Date();
        const location = ip ? this.effects.location(ip) : null;
        const kicked = await this.db.$transaction(async (tx) => {
            const result = await tx.owl_user_sessions.updateMany({ where: { user_id: user.id, status: 'active', ...live }, data: { status: 'kicked', kicked_at: now, updatedAt: now } });
            await tx.owl_users.update({ where: { id: user.id }, data: { last_login_at: now, last_login_ip: ip, updatedAt: now } });
            if (device && ip)
                await tx.owl_user_sessions.create({ data: { user_id: user.id, session_token: createHash('sha256').update(token).digest('hex'), device_info: device, location_info: location, login_at: now, last_active_at: now, status: 'active' } });
            return result.count;
        });
        if (kicked)
            this.effects.kicked(user.id, { device: device?.device_name || '未知设备', location: location ? `${location.city}, ${location.country}` : '未知位置', time: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) });
        return { token, user: await userProfile(this.db, user.id, true) };
    }
    getCurrentUser(user: any) { return userProfile(this.db, user.id, true); }
    async changePassword(id: string, body: any) {
        const user = await requireRow(this.db.owl_users, id, '用户');
        if (!user.password || !await bcrypt.compare(body.oldPassword, user.password))
            throw new BadRequestException('原密码错误');
        await this.users.resetPassword(id, body.newPassword);
        return { message: '密码修改成功' };
    }
    async refreshToken(id: string) {
        const user = await requireRow(this.db.owl_users, id, '用户');
        if (user.status !== 'active')
            throw new ForbiddenException('账户状态异常');
        return { token: this.effects.generateToken(user) };
    }
    private async phoneUser(phone: string, real_name?: string) {
        let user = await this.db.owl_users.findFirst({ where: { phone, ...live } });
        if (!user) {
            const base = `user_${phone.slice(-4)}`;
            let username = base, counter = 1;
            while (await this.db.owl_users.findFirst({ where: { username, ...live } }))
                username = `${base}_${counter++}`;
            const role = await this.db.owl_roles.findFirst({ where: { code: 'user', ...live } });
            const created = await this.users.createUser({ username, email: `${phone}@sms.temp`, phone, real_name: real_name || `用户${phone.slice(-4)}`, status: 'active', role_ids: role ? [role.id] : [] });
            user = await requireRow(this.db.owl_users, created.id, '用户');
        }
        if (user!.status !== 'active')
            throw new ForbiddenException('账户状态异常');
        return user!;
    }
    sendVerificationCode(phone: string, ip: string) { return this.effects.sendSms(phone, ip); }
    async loginByPhone(phone: string, code: string) {
        await this.effects.verifySms(phone, code);
        const user = await this.phoneUser(phone);
        await this.db.owl_users.update({ where: { id: user.id }, data: { last_login_at: new Date(), updatedAt: new Date() } });
        return { token: this.effects.generateToken(user), user: await userProfile(this.db, user.id) };
    }
    async registerByPhone(phone: string, code: string, body: any) {
        await this.effects.verifySms(phone, code);
        if (await this.db.owl_users.findFirst({ where: { phone, ...live } }))
            throw new BadRequestException('手机号已被注册');
        return safeUser(await this.phoneUser(phone, body.real_name));
    }
}
