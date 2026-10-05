import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { UploadsService } from './uploads.service';
const { success } = shared('utils/response');

@Controller('api/system/upload')
@UseGuards(IdentityGuard)
export class UploadController {
 constructor(private readonly service: UploadsService) {}

  @Post('file')
 @IdentityRoute({"validation": ["upload", "uploadFile"], "upload": {"field": "file", "multiple": false, "max": 10}})
 async uploadFile(@Req() req: any, @Res() res: Response) {
    try {
      if (!req.file) {
        throw new Error('没有找到上传的文件');
      }

      const { category = 'normal' } = req.body;
      const { buffer, originalname, mimetype } = req.file;
      const userId = req.user?.id;

      // 上传文件到 Minio
      const filePath = await this.service.uploadFile(
        buffer,
        originalname,
        mimetype,
        category,
        userId
      );

      success(res, { path: filePath }, '文件上传成功', 201);
    } catch (error: any) {
      throw error;
    }
  }
}
