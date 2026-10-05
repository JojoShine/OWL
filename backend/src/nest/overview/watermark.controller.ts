import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { WatermarkService } from './watermark.service';
const { success, error: errorResponse } = shared('utils/response');
@Controller('api/system/watermark')
@UseGuards(IdentityGuard)
export class WatermarkController {
    constructor(private readonly service: WatermarkService) { }
    @Get('')
    @IdentityRoute({ "validation": ["watermark", "getWatermark"] })
    async getWatermark(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const config = await this.service.getWatermarkConfig();
            success(res, config, '获取水印配置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('rendered')
    @IdentityRoute({ "validation": ["watermark", "getRenderedWatermark"] })
    async getRenderedWatermark(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const user = req.user;
            const config = await this.service.getRenderedWatermark(user);
            success(res, config, '获取渲染后的水印成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put('')
    @IdentityRoute({ "permission": ["watermark", "update"], "validation": ["watermark", "updateWatermark"] })
    async updateWatermark(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const updateData = req.body;
            const user = req.user;
            // 验证配置数据
            const validation = this.service.validateConfig(updateData);
            if (!validation.valid) {
                return errorResponse(res, validation.errors.join('; '), 400);
            }
            const config = await this.service.updateWatermarkConfig(updateData, user);
            success(res, config, '更新水印配置成功');
        }
        catch (error: any) {
            throw error;
        }
    }
}
