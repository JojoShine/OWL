import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from './identity.guard';
import { PermissionsService } from './permissions.service';
const { success, paginated, list } = shared('utils/response');
@Controller('api/system/permissions')
@UseGuards(IdentityGuard)
export class PermissionController {
    constructor(private readonly service: PermissionsService) { }
    @Get('')
    @IdentityRoute({ "permission": ["permission", "read"], "validation": ["permission", "getPermissions"] })
    async getPermissions(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.getPermissions(req.query);
        paginated(res, result.data, result.pagination, '获取权限列表成功');
    }
    @Get('all')
    @IdentityRoute({ "permission": ["permission", "read"] })
    async getAllPermissions(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const permissions = await this.service.getAllPermissions();
        list(res, permissions, '获取所有权限成功');
    }
    @Post('')
    @IdentityRoute({ "roles": ["super_admin"], "validation": ["permission", "createPermission"] })
    async createPermission(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const permission = await this.service.createPermission(req.body);
        success(res, permission, '创建权限成功', 201);
    }
    @Get('resources')
    @IdentityRoute({ "permission": ["permission", "read"] })
    async getResources(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const resources = await this.service.getResources();
        success(res, resources, '获取资源列表成功');
    }
    @Get('actions')
    @IdentityRoute({ "permission": ["permission", "read"] })
    async getActions(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const actions = await this.service.getActions();
        success(res, actions, '获取操作类型列表成功');
    }
    @Get('categories')
    @IdentityRoute({ "permission": ["permission", "read"] })
    async getCategories(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const categories = await this.service.getCategories();
        success(res, categories, '获取分类列表成功');
    }
    @Get(':id')
    @IdentityRoute({ "permission": ["permission", "read"], "validation": ["permission", "getPermissionById"] })
    async getPermissionById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const permission = await this.service.getPermissionById(req.params.id);
        success(res, permission, '获取权限详情成功');
    }
    @Put(':id')
    @IdentityRoute({ "roles": ["super_admin"], "validation": ["permission", "updatePermission"] })
    async updatePermission(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const permission = await this.service.updatePermission(req.params.id, req.body);
        success(res, permission, '更新权限成功');
    }
    @Delete(':id')
    @IdentityRoute({ "roles": ["super_admin"], "validation": ["permission", "deletePermission"] })
    async deletePermission(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.deletePermission(req.params.id);
        success(res, result, '删除权限成功');
    }
}
