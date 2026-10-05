import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from './identity.guard';
import { AuthService } from './auth.service';
const { success } = shared('utils/response');
const { loginLogger } = shared('config/logger');
const { parseUserAgent } = shared('utils/user-agent-parser');
@Controller('api/system/auth')
@UseGuards(IdentityGuard)
export class AuthController {
    constructor(private readonly service: AuthService) { }
    @Post('register')
    @IdentityRoute({ "public": true, "validation": ["auth", "register"] })
    async register(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const user = await this.service.register(req.body);
            success(res, user, '注册成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('login')
    @IdentityRoute({ "public": true, "validation": ["auth", "login"] })
    async login(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const ip = req.clientIp;
        const userAgent = req.get('user-agent') || '';
        const { username } = req.body;
        try {
            // 解析设备信息
            const deviceInfo = parseUserAgent(userAgent);
            // 调用认证服务并传递设备信息和IP
            const result = await this.service.login(req.body, deviceInfo, ip);
            // 记录登录成功日志
            loginLogger.info(JSON.stringify({
                user: result.user.id,
                username: result.user.username,
                action: 'login',
                status: 'success',
                ip,
                userAgent,
                device: deviceInfo.device_name,
                message: '登录成功',
                timestamp: new Date().toISOString(),
            }));
            success(res, result, '登录成功');
        }
        catch (error: any) {
            // 记录登录失败日志
            loginLogger.info(JSON.stringify({
                user: null,
                username: username || 'unknown',
                action: 'login',
                status: 'failure',
                ip,
                userAgent,
                message: error.message || '登录失败',
                timestamp: new Date().toISOString(),
            }));
            throw error;
        }
    }
    @Get('me')
    @IdentityRoute({})
    async getCurrentUser(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const user = await this.service.getCurrentUser(req.user);
            success(res, user, '获取用户信息成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('change-password')
    @IdentityRoute({ "validation": ["auth", "changePassword"] })
    async changePassword(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.changePassword(req.user.id, req.body);
            success(res, result, '密码修改成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('refresh-token')
    @IdentityRoute({})
    async refreshToken(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.refreshToken(req.user.id);
            success(res, result, 'Token刷新成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('logout')
    @IdentityRoute({})
    async logout(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const ip = req.clientIp;
        const userAgent = req.get('user-agent');
        try {
            // 记录登出日志
            loginLogger.info(JSON.stringify({
                user: req.user?.id || null,
                username: req.user?.username || 'unknown',
                action: 'logout',
                status: 'success',
                ip,
                userAgent,
                message: '登出成功',
                timestamp: new Date().toISOString(),
            }));
            // 这里可以将token加入黑名单（Redis）
            // 目前简单返回成功
            success(res, null, '登出成功');
        }
        catch (error: any) {
            throw error;
        }
    }
}
