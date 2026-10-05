import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from './identity.guard';
import { UsersService } from './users.service';
const { success, paginated } = shared('utils/response');
@Controller('api/system/users')
@UseGuards(IdentityGuard)
export class UserController {
    constructor(private readonly service: UsersService) { }
    @Get('')
    @IdentityRoute({ "permission": ["user", "read"], "validation": ["user", "getUsers"] })
    async getUsers(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.getUsers(req.query);
        paginated(res, result.data, result.pagination, '获取用户列表成功');
    }
    @Get(':id')
    @IdentityRoute({ "permission": ["user", "read"], "validation": ["user", "getUserById"] })
    async getUserById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const user = await this.service.getUserById(req.params.id);
        success(res, user, '获取用户详情成功');
    }
    @Post('')
    @IdentityRoute({ "permission": ["user", "create"], "validation": ["user", "createUser"] })
    async createUser(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const user = await this.service.createUser(req.body);
        success(res, user, '创建用户成功', 201);
    }
    @Put(':id')
    @IdentityRoute({ "permission": ["user", "update"], "validation": ["user", "updateUser"] })
    async updateUser(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const user = await this.service.updateUser(req.params.id, req.body);
        success(res, user, '更新用户成功');
    }
    @Delete(':id')
    @IdentityRoute({ "permission": ["user", "delete"], "validation": ["user", "deleteUser"] })
    async deleteUser(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.deleteUser(req.params.id);
        success(res, result, '删除用户成功');
    }
    @Post(':id/reset-password')
    @IdentityRoute({ "permission": ["user", "update"], "validation": ["user", "resetPassword"] })
    async resetPassword(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.resetPassword(req.params.id, req.body.password);
        success(res, result, '重置密码成功');
    }
}
