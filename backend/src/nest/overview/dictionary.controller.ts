import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { DictionaryService } from './dictionary.service';
const { success } = shared('utils/response');
@Controller('api/system/dictionary')
@UseGuards(IdentityGuard)
export class DictionaryController {
    constructor(private readonly service: DictionaryService) { }
    @Get(':type')
    @IdentityRoute({ "permission": ["dictionary", "read"] })
    async getDictionaryByType(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { type } = req.params;
            const items = await this.service.getDictionaryByType(type);
            success(res, items, '获取字典成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get('')
    @IdentityRoute({ "permission": ["dictionary", "read"] })
    async getDictionaries(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const { types } = req.query;
            if (!types) {
                return success(res, {}, '请提供字典类型');
            }
            const typeArray = types.split(',').map((t: string) => t.trim());
            const items = await this.service.getDictionaryByTypes(typeArray);
            success(res, items, '获取字典成功');
        }
        catch (error: any) {
            throw error;
        }
    }
}
