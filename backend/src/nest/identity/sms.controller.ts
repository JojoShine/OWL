import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from './identity.guard';
import { AuthService } from './auth.service';
const { success } = shared('utils/response');
const { logger, loginLogger } = shared('config/logger');
@Controller('api/system/auth/sms')
@UseGuards(IdentityGuard)
export class SMSController {
    constructor(private readonly service: AuthService) { }
    @Post('send-code')
    @IdentityRoute({ "public": true, "validation": ["sms", "sendCode"] })
    async sendCode(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { phone } = req.body;
            const ip = req.clientIp;
            const result = await this.service.sendVerificationCode(phone, ip);
            success(res, result, '验证码已发送');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('register')
    @IdentityRoute({ "public": true, "validation": ["sms", "register"] })
    async register(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { phone, code, ...userData } = req.body;
            const result = await this.service.registerByPhone(phone, code, userData);
            success(res, result, '注册成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('login')
    @IdentityRoute({ "public": true, "validation": ["sms", "login"] })
    async login(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const ip = req.clientIp;
        const userAgent = req.get('user-agent');
        try {
            const { phone, code } = req.body;
            const result = await this.service.loginByPhone(phone, code);
            // 记录登录日志
            loginLogger.info(JSON.stringify({
                user: result.user.id,
                username: result.user.username,
                action: 'sms_login',
                status: 'success',
                ip,
                userAgent,
                message: '短信验证码登录成功',
                timestamp: new Date().toISOString(),
            }));
            success(res, result, '登录成功');
        }
        catch (error: any) {
            // 记录失败日志
            loginLogger.info(JSON.stringify({
                user: null,
                username: req.body.phone || 'unknown',
                action: 'sms_login',
                status: 'failed',
                ip,
                userAgent,
                message: error.message || '短信验证码登录失败',
                timestamp: new Date().toISOString(),
            }));
            throw error;
        }
    }
}
