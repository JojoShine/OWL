import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { SqlApiKeysService } from './api-key.service';
const { success, created } = shared('utils/response');
@Controller('api/system/api-builder')
@UseGuards(IdentityGuard)
export class ApiBuilderKeysController {
    constructor(private readonly apiKeyService: SqlApiKeysService) { }
    @Get('keys')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["api-key", "read"], "validation": ["api-key", "list"] })
    async getAllKeys(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const keys = await this.apiKeyService.listKeys(req.user.id, { interfaceId: req.query.interface_id });
            success(res, keys, '获取接口密钥列表成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('keys')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["api-key", "create"], "validation": ["api-key", "create"] })
    async createKey(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            created(res, await this.apiKeyService.createKey(req.body, req.user.id), '接口密钥创建成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put('keys/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["api-key", "update"], "validation": ["api-key", "update"] })
    async updateKey(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            success(res, await this.apiKeyService.updateKey(req.params.id, req.body, req.user.id), '接口密钥更新成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Patch('keys/:id/status')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["api-key", "update"], "validation": ["api-key", "changeStatus"] })
    async changeStatus(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const key = await this.apiKeyService.changeStatus(req.params.id, req.body.status, req.user.id);
            success(res, { id: key.id, status: key.status }, '接口密钥状态已更新');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('keys/:id/regenerate')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["api-key", "update"], "validation": ["api-key", "keyId"] })
    async regenerateKey(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            success(res, await this.apiKeyService.regenerateKey(req.params.id, req.user.id), '接口密钥已重新生成');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete('keys/:id')
    @HttpCode(200)
    @IdentityRoute({ "permission": ["api-key", "delete"], "validation": ["api-key", "keyId"] })
    async deleteKey(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            await this.apiKeyService.deleteKey(req.params.id, req.user.id);
            success(res, null, '接口密钥已删除');
        }
        catch (error: any) {
            throw error;
        }
    }
}
