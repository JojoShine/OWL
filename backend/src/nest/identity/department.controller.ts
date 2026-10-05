import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from './identity.guard';
import { DepartmentsService } from './departments.service';
const { success, paginated, list } = shared('utils/response');
@Controller('api/system/departments')
@UseGuards(IdentityGuard)
export class DepartmentController {
    constructor(private readonly service: DepartmentsService) { }
    @Get('')
    @IdentityRoute({ "validation": ["department", "getDepartments"] })
    async getDepartments(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.getDepartments(req.query);
        paginated(res, result.data, result.pagination, '获取部门列表成功');
    }
    @Get('tree')
    @IdentityRoute({})
    async getDepartmentTree(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const tree = await this.service.getDepartmentTree();
        list(res, tree, '获取部门树成功');
    }
    @Get(':id')
    @IdentityRoute({ "validation": ["department", "getDepartmentById"] })
    async getDepartmentById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const department = await this.service.getDepartmentById(req.params.id);
        success(res, department, '获取部门详情成功');
    }
    @Post('')
    @IdentityRoute({ "validation": ["department", "createDepartment"] })
    async createDepartment(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const department = await this.service.createDepartment(req.body);
        success(res, department, '创建部门成功', 201);
    }
    @Put(':id')
    @IdentityRoute({ "validation": ["department", "updateDepartment"] })
    async updateDepartment(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const department = await this.service.updateDepartment(req.params.id, req.body);
        success(res, department, '更新部门成功');
    }
    @Delete(':id')
    @IdentityRoute({ "validation": ["department", "deleteDepartment"] })
    async deleteDepartment(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.deleteDepartment(req.params.id);
        success(res, result, '删除部门成功');
    }
    @Get(':id/members')
    @IdentityRoute({ "validation": ["department", "getDepartmentById"] })
    async getDepartmentMembers(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.getDepartmentMembers(req.params.id, req.query);
        paginated(res, result.members, result.pagination, '获取部门成员成功');
    }
}
