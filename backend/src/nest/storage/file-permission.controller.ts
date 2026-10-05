import {Controller,Get,Post,Put,Delete,Req,Res,UseGuards,HttpCode} from '@nestjs/common';
import type {Response} from 'express';
import {IdentityRoute,IdentityGuard} from '../identity/identity.guard';
import {FilePermissionsService} from './file-permissions.service';
import {storageSchemas} from './storage.validation';
import {shared} from '../compatibility/shared';

const { logger } = shared('config/logger');
const ApiError = shared('utils/ApiError');

@Controller('api/system')
@UseGuards(IdentityGuard)
export class FilePermissionController {
 constructor(private readonly service: FilePermissionsService) {}

  @Get('files/:id/permissions')
 @IdentityRoute({permission:['file','read'],schema:storageSchemas.id})
 async getFilePermissions(@Req() req:any,@Res() res:Response) {
    try {
      const { id } = req.params;
      const permissions = await this.service.getPermissions('file', id);

      return res.json({
        code: 200,
        message: '获取成功',
        data: permissions,
      });
    } catch (error: any) {
      throw error;
    }
  }


  @Get('folders/:id/permissions')
 @IdentityRoute({permission:['folder','read'],schema:storageSchemas.id})
 async getFolderPermissions(@Req() req:any,@Res() res:Response) {
    try {
      const { id } = req.params;
      const permissions = await this.service.getPermissions('folder', id);

      return res.json({
        code: 200,
        message: '获取成功',
        data: permissions,
      });
    } catch (error: any) {
      throw error;
    }
  }


  @Post('files/:id/permissions')
 @HttpCode(200)
 @IdentityRoute({permission:['file','update'],schema:storageSchemas.permission})
 async addFilePermission(@Req() req:any,@Res() res:Response) {
    try {
      const { id } = req.params;
      const { userId, roleId, permission } = req.body;
      const currentUserId = req.user.id;

      // 验证权限
      const hasAdminPermission = await this.service.checkPermission(
        currentUserId,
        'file',
        id,
        'admin'
      );

      if (!hasAdminPermission) {
        throw ApiError.forbidden('您没有权限管理此文件的权限');
      }

      const result = await this.service.addPermission(
        'file',
        id,
        { userId, roleId, permission },
        currentUserId
      );

      return res.json({
        code: 201,
        message: '权限添加成功',
        data: result,
      });
    } catch (error: any) {
      throw error;
    }
  }


  @Post('folders/:id/permissions')
 @HttpCode(200)
 @IdentityRoute({permission:['folder','update'],schema:storageSchemas.permission})
 async addFolderPermission(@Req() req:any,@Res() res:Response) {
    try {
      const { id } = req.params;
      const { userId, roleId, permission } = req.body;
      const currentUserId = req.user.id;

      // 验证权限
      const hasAdminPermission = await this.service.checkPermission(
        currentUserId,
        'folder',
        id,
        'admin'
      );

      if (!hasAdminPermission) {
        throw ApiError.forbidden('您没有权限管理此文件夹的权限');
      }

      const result = await this.service.addPermission(
        'folder',
        id,
        { userId, roleId, permission },
        currentUserId
      );

      return res.json({
        code: 201,
        message: '权限添加成功',
        data: result,
      });
    } catch (error: any) {
      throw error;
    }
  }


  @Delete('file-permissions/:id')
 @IdentityRoute({permission:['file','delete'],schema:storageSchemas.id})
 async deletePermission(@Req() req:any,@Res() res:Response) {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;

      // 获取权限信息
      const permission = await this.service.getPermissionById(id);

      if (!permission) {
        throw ApiError.notFound('权限不存在');
      }

      // 验证删除权限：只有拥有该资源admin权限的用户才能删除
      const hasAdminPermission = await this.service.checkPermission(
        currentUserId,
        permission.resource_type,
        permission.resource_id,
        'admin'
      );

      if (!hasAdminPermission) {
        throw ApiError.forbidden('您没有权限删除此权限');
      }

      await this.service.deletePermission(id);

      return res.json({
        code: 200,
        message: '权限删除成功',
      });
    } catch (error: any) {
      throw error;
    }
  }


  @Put('files/:id/inherit')
 @IdentityRoute({permission:['file','update'],schema:storageSchemas.inherit})
 async setFileInherit(@Req() req:any,@Res() res:Response) {
    try {
      const { id } = req.params;
      const { inherit } = req.body;
      const currentUserId = req.user.id;

      // 验证权限
      const hasAdminPermission = await this.service.checkPermission(
        currentUserId,
        'file',
        id,
        'admin'
      );

      if (!hasAdminPermission) {
        throw ApiError.forbidden('您没有权限修改此文件的权限设置');
      }

      const result = await this.service.setInheritPermissions('file', id, inherit);

      return res.json({
        code: 200,
        message: '权限继承设置成功',
        data: result,
      });
    } catch (error: any) {
      throw error;
    }
  }


  @Put('folders/:id/inherit')
 @IdentityRoute({permission:['folder','update'],schema:storageSchemas.inherit})
 async setFolderInherit(@Req() req:any,@Res() res:Response) {
    try {
      const { id } = req.params;
      const { inherit } = req.body;
      const currentUserId = req.user.id;

      // 验证权限
      const hasAdminPermission = await this.service.checkPermission(
        currentUserId,
        'folder',
        id,
        'admin'
      );

      if (!hasAdminPermission) {
        throw ApiError.forbidden('您没有权限修改此文件夹的权限设置');
      }

      const result = await this.service.setInheritPermissions('folder', id, inherit);

      return res.json({
        code: 200,
        message: '权限继承设置成功',
        data: result,
      });
    } catch (error: any) {
      throw error;
    }
  }
}
