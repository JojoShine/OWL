import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { SharesService } from './shares.service';
import { storageSchemas } from './storage.validation';
const { success, list } = shared('utils/response');

@Controller('api/system/file-shares')
@UseGuards(IdentityGuard)
export class FileShareController {
 constructor(private readonly service: SharesService) {}

  @Post('')
 @IdentityRoute({"permission": ["file-share", "create"], "schema": storageSchemas.createShare})
 async createShare(@Req() req: any, @Res() res: Response) {
    try {
      const share = await this.service.createShare(req.body, req.user.id);
      success(res, share, '创建分享成功', 201);
    } catch (error: any) {
      throw error;
    }
  }

 @Get(':shareCode')
 @IdentityRoute({"public": true, "schema": storageSchemas.shareCode})
 async getShareByCode(@Req() req: any, @Res() res: Response) {
    try {
      const share = await this.service.getShareByCode(req.params.shareCode);
      success(res, share, '获取分享信息成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Get('')
 @IdentityRoute({"permission": ["file-share", "read"]})
 async getUserShares(@Req() req: any, @Res() res: Response) {
    try {
      const shares = await this.service.getUserShares(req.user.id);
      list(res, shares, '获取分享列表成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Get(':shareCode/download')
 @IdentityRoute({"public": true, "schema": storageSchemas.shareCode})
 async downloadSharedFile(@Req() req: any, @Res() res: Response) {
    try {
      const { stream, filename, mimeType, size } = await this.service.downloadSharedFile(
        req.params.shareCode
      );

      // 设置响应头
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      if (size) {
        res.setHeader('Content-Length', size);
      }

      // 将文件流传输给客户端
      stream.pipe(res);
    } catch (error: any) {
      throw error;
    }
  }

 @Delete(':id')
 @IdentityRoute({"permission": ["file-share", "delete"], "schema": storageSchemas.id})
 async deleteShare(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.service.deleteShare(req.params.id, req.user.id);
      success(res, result, '删除分享成功');
    } catch (error: any) {
      throw error;
    }
  }
}
