import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from './identity.guard';
import { RolesService } from './roles.service';
const { success, paginated, list } = shared('utils/response');
@Controller('api/system/roles')
@UseGuards(IdentityGuard)
export class RoleController {
    constructor(private readonly service: RolesService) { }
    @Get('')
    @IdentityRoute({ "permission": ["role", "read"], "validation": ["role", "getRoles"] })
    async getRoles(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.getRoles(req.query);
        paginated(res, result.data, result.pagination, '获取角色列表成功');
    }
    @Get('all')
    @IdentityRoute({ "permission": ["role", "read"] })
    async getAllRoles(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const roles = await this.service.getAllRoles();
        list(res, roles, '获取所有角色成功');
    }
    @Get(':id')
    @IdentityRoute({ "permission": ["role", "read"], "validation": ["role", "getRoleById"] })
    async getRoleById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const role = await this.service.getRoleById(req.params.id);
        success(res, role, '获取角色详情成功');
    }
    @Post('')
    @IdentityRoute({ "permission": ["role", "create"], "validation": ["role", "createRole"] })
    async createRole(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const role = await this.service.createRole(req.body);
        success(res, role, '创建角色成功', 201);
    }
    @Put(':id')
    @IdentityRoute({ "permission": ["role", "update"], "validation": ["role", "updateRole"] })
    async updateRole(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const role = await this.service.updateRole(req.params.id, req.body);
        success(res, role, '更新角色成功');
    }
    @Delete(':id')
    @IdentityRoute({ "permission": ["role", "delete"], "validation": ["role", "deleteRole"] })
    async deleteRole(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.deleteRole(req.params.id);
        success(res, result, '删除角色成功');
    }
}
