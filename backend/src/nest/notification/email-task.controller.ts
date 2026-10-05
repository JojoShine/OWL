import { Controller, Get, Post, Put, Patch, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { EmailTasksService } from './email-tasks.service';
const { success, paginated } = shared('utils/response');
@Controller('api/system/email-tasks')
@UseGuards(IdentityGuard)
export class EmailTaskController {
    constructor(private readonly service: EmailTasksService) { }
    @Get('')
    @IdentityRoute({ "permission": ["email-task", "read"], "validation": ["email-task", "listTasks"] })
    async getTasks(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const result = await this.service.getAllTasks(req.query);
            paginated(res, result.items, {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages,
            }, '获取邮件任务列表成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post('')
    @IdentityRoute({ "permission": ["email-task", "create"], "validation": ["email-task", "createTask"] })
    async createTask(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const task = await this.service.createTask(req.body, req.user?.id);
            success(res, task, '创建邮件任务成功', 201);
        }
        catch (error: any) {
            throw error;
        }
    }
    @Get(':id')
    @IdentityRoute({ "permission": ["email-task", "read"] })
    async getTaskById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const task = await this.service.getTaskById(req.params.id);
            success(res, task, '获取邮件任务详情成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Put(':id')
    @IdentityRoute({ "permission": ["email-task", "update"], "validation": ["email-task", "updateTask"] })
    async updateTask(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const task = await this.service.updateTask(req.params.id, req.body, req.user?.id);
            success(res, task, '更新邮件任务成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Delete(':id')
    @IdentityRoute({ "permission": ["email-task", "delete"] })
    async deleteTask(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            await this.service.deleteTask(req.params.id, req.user?.id);
            success(res, null, '删除邮件任务成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Patch(':id/enable')
    @IdentityRoute({ "permission": ["email-task", "update"] })
    async enableTask(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const task = await this.service.enableTask(req.params.id);
            success(res, task, '启用邮件任务成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Patch(':id/disable')
    @IdentityRoute({ "permission": ["email-task", "update"] })
    async disableTask(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            const task = await this.service.disableTask(req.params.id);
            success(res, task, '禁用邮件任务成功');
        }
        catch (error: any) {
            throw error;
        }
    }
    @Post(':id/execute')
    @IdentityRoute({ "permission": ["email-task", "update"] })
    async manualExecuteTask(
    @Req()
    req: any,
    @Res()
    res: Response) {
        try {
            await this.service.manualExecuteTask(req.params.id);
            success(res, null, '邮件任务已提交执行');
        }
        catch (error: any) {
            throw error;
        }
    }
}
