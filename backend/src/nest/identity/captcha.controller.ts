import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from './identity.guard';
const captchaService = shared('auth/captcha');
const { success } = shared('utils/response');
@Controller('api/public/captcha')
@UseGuards(IdentityGuard)
export class CaptchaController {
    @Get('')
    @IdentityRoute({ "public": true })
    async getCaptcha(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const captcha = await captchaService.generateCaptcha();
        success(res, captcha, '获取验证码成功');
    }
    @Post('verify')
    @IdentityRoute({ "public": true })
    async verifyCaptcha(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const { captchaId, captchaCode } = req.body;
        const isValid = await captchaService.verifyCaptcha(captchaId, captchaCode);
        success(res, { isValid }, isValid ? '验证码正确' : '验证码错误');
    }
}
