import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { UploadsService } from './uploads.service';
const { getMimeType } = shared('utils/file');

@Controller('api/system/upload')
@UseGuards(IdentityGuard)
export class UploadStreamController {
 constructor(private readonly service: UploadsService) {}

  @Get('stream')
 @IdentityRoute({"public": true})
 async getFileStream(@Req() req: any, @Res() res: Response) {
    try {
      const { path } = req.query;

      if (!path) {
        throw new Error('缺少路径参数');
      }

      // 获取文件流
      const { stream, objectPath } = await this.service.getFileStream(path);

      // 获取 MIME 类型
      const mimeType = getMimeType(objectPath);

      // 设置响应头
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline`);

      // 返回文件流
      stream.pipe(res);

      // 错误处理
      stream.on('error', (error: Error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: '文件读取失败' });
        }
      });
    } catch (error: any) {
      throw error;
    }
  }
}
