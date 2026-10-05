import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { FoldersService } from './folders.service';
const { success, paginated, list } = shared('utils/response');

@Controller('api/system/folders')
@UseGuards(IdentityGuard)
export class FolderController {
 constructor(private readonly service: FoldersService) {}

  @Get('')
 @IdentityRoute({"permission": ["folder", "read"], "validation": ["folder", "getFolders"]})
 async getFolders(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.service.getFolders(req.query, req.user.id);
      paginated(res, result.data, result.pagination, '获取文件夹列表成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Get('tree')
 @IdentityRoute({"permission": ["folder", "read"]})
 async getFolderTree(@Req() req: any, @Res() res: Response) {
    try {
      const tree = await this.service.getFolderTree(req.user.id);
      list(res, tree, '获取文件夹树成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Post('')
 @IdentityRoute({"permission": ["folder", "create"], "validation": ["folder", "createFolder"]})
 async createFolder(@Req() req: any, @Res() res: Response) {
    try {
      const folder = await this.service.createFolder(req.body, req.user.id);
      success(res, folder, '创建文件夹成功', 201);
    } catch (error: any) {
      throw error;
    }
  }

 @Get(':id')
 @IdentityRoute({"permission": ["folder", "read"], "validation": ["folder", "getFolderById"]})
 async getFolderById(@Req() req: any, @Res() res: Response) {
    try {
      const folder = await this.service.getFolderById(req.params.id, req.user.id);
      success(res, folder, '获取文件夹详情成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Get(':id/contents')
 @IdentityRoute({"permission": ["folder", "read"], "validation": ["folder", "getFolderContents"]})
 async getFolderContents(@Req() req: any, @Res() res: Response) {
    try {
      const contents = await this.service.getFolderContents(
        req.params.id,
        req.user.id,
        req.query
      );
      success(res, contents, '获取文件夹内容成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Put(':id')
 @IdentityRoute({"permission": ["folder", "update"], "validation": ["folder", "updateFolder"]})
 async updateFolder(@Req() req: any, @Res() res: Response) {
    try {
      const folder = await this.service.updateFolder(
        req.params.id,
        req.body,
        req.user.id
      );
      success(res, folder, '更新文件夹成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Delete(':id')
 @IdentityRoute({"permission": ["folder", "delete"], "validation": ["folder", "deleteFolder"]})
 async deleteFolder(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.service.deleteFolder(req.params.id, req.user.id);
      success(res, result, '删除文件夹成功');
    } catch (error: any) {
      throw error;
    }
  }
}
