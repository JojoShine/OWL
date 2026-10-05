import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { FilesService } from './files.service';
const { success, paginated } = shared('utils/response');

const ApiError = shared('utils/ApiError');

@Controller('api/system/files')
@UseGuards(IdentityGuard)
export class FileController {
 constructor(private readonly service: FilesService) {}

  @Get('')
 @IdentityRoute({"permission": ["file", "read"], "validation": ["file", "getFiles"]})
 async getFiles(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.service.getFiles(req.query, req.user.id);
      paginated(res, result.data, result.pagination, '获取文件列表成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Post('upload')
 @IdentityRoute({"permission": ["file", "create"], "upload": {"field": "files", "multiple": true, "max": 10}})
 async uploadFile(@Req() req: any, @Res() res: Response) {
    try {
      // 单文件上传
      if (req.file) {
        const file = await this.service.uploadFile(
          { ...req.file, body: req.body },
          req.user.id
        );
        success(res, file, '文件上传成功', 201);
      }
      // 多文件上传
      else if (req.files && req.files.length > 0) {
        const result = await this.service.uploadMultipleFiles(
          req.files,
          req.body,
          req.user.id
        );
        success(res, result, '文件批量上传完成', 201);
      } else {
        throw new Error('没有找到上传的文件');
      }
    } catch (error: any) {
      throw error;
    }
  }

 @Post('batch-delete')
 @IdentityRoute({"permission": ["file", "delete"], "validation": ["file", "batchDeleteFiles"]})
 async batchDeleteFiles(@Req() req: any, @Res() res: Response) {
    try {
      const { ids } = req.body;
      const result = await this.service.batchDeleteFiles(ids, req.user.id);
      success(res, result, '批量删除完成');
    } catch (error: any) {
      throw error;
    }
  }

 @Get('stats')
 @IdentityRoute({"permission": ["file", "read"]})
 async getStats(@Req() req: any, @Res() res: Response) {
    try {
      const stats = await this.service.getStorageStats(req.user.id);
      success(res, stats, '获取存储统计成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Get(':id')
 @IdentityRoute({"permission": ["file", "read"], "validation": ["file", "getFileById"]})
 async getFileById(@Req() req: any, @Res() res: Response) {
    try {
      const file = await this.service.getFileById(req.params.id, req.user.id);
      success(res, file, '获取文件详情成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Get(':id/download')
 @IdentityRoute({"permission": ["file", "read"], "validation": ["file", "getFileById"]})
 async downloadFile(@Req() req: any, @Res() res: Response) {
    try {
      const { stream, filename, mimeType, size } = await this.service.downloadFile(
        req.params.id,
        req.user.id
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

 @Get(':id/preview-public')
 @IdentityRoute({"public": true, "validation": ["file", "getFileById"]})
 async previewFilePublic(@Req() req: any, @Res() res: Response) {
    try {
      const file = await this.service.getPublicFile(req.params.id);

      if (!file) {
        throw new ApiError('文件不存在', 404);
      }

      const { stream, filename, mimeType, size } = await this.service.downloadFile(
        req.params.id,
        file.uploaded_by // 使用文件上传者的ID来获取文件内容
      );

      // 设置响应头（inline 表示预览而非下载）
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
      if (size) {
        res.setHeader('Content-Length', size);
      }

      // 将文件流传输给客户端
      stream.pipe(res);
    } catch (error: any) {
      throw error;
    }
  }

 @Put(':id')
 @IdentityRoute({"permission": ["file", "update"], "validation": ["file", "updateFile"]})
 async updateFile(@Req() req: any, @Res() res: Response) {
    try {
      const file = await this.service.updateFile(
        req.params.id,
        req.body,
        req.user.id
      );
      success(res, file, '文件更新成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Delete(':id')
 @IdentityRoute({"permission": ["file", "delete"], "validation": ["file", "deleteFile"]})
 async deleteFile(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.service.deleteFile(req.params.id, req.user.id);
      success(res, result, '文件删除成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Put(':id/move')
 @IdentityRoute({"permission": ["file", "update"], "validation": ["file", "moveFile"]})
 async moveFile(@Req() req: any, @Res() res: Response) {
    try {
      const { folder_id } = req.body;
      const file = await this.service.moveFile(
        req.params.id,
        folder_id,
        req.user.id
      );
      success(res, file, '文件移动成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Post(':id/copy')
 @IdentityRoute({"permission": ["file", "create"], "validation": ["file", "copyFile"]})
 async copyFile(@Req() req: any, @Res() res: Response) {
    try {
      const { folder_id } = req.body;
      const file = await this.service.copyFile(
        req.params.id,
        folder_id,
        req.user.id
      );
      success(res, file, '文件复制成功', 201);
    } catch (error: any) {
      throw error;
    }
  }
}
