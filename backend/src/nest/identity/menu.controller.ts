import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from './identity.guard';
import { MenusService } from './menus.service';
const { success, paginated, list } = shared('utils/response');
const { previewPermissions } = shared('utils/permission-generator');
@Controller('api/system/menus')
@UseGuards(IdentityGuard)
export class MenuController {
    constructor(private readonly service: MenusService) { }
    @Get('')
    @IdentityRoute({ "permission": ["menu", "read"], "validation": ["menu", "getMenus"] })
    async getMenus(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.getMenus(req.query);
        paginated(res, result.data, result.pagination, '获取菜单列表成功');
    }
    @Get('tree')
    @IdentityRoute({ "permission": ["menu", "read"] })
    async getMenuTree(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const tree = await this.service.getMenuTree();
        list(res, tree, '获取菜单树成功');
    }
    @Get('user-tree')
    @IdentityRoute({})
    async getUserMenuTree(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const tree = await this.service.getUserMenuTree(req.user.id);
        success(res, tree, '获取用户菜单树成功');
    }
    @Get(':id')
    @IdentityRoute({ "permission": ["menu", "read"], "validation": ["menu", "getMenuById"] })
    async getMenuById(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const menu = await this.service.getMenuById(req.params.id);
        success(res, menu, '获取菜单详情成功');
    }
    @Post('')
    @IdentityRoute({ "permission": ["menu", "create"], "validation": ["menu", "createMenu"] })
    async createMenu(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const menu = await this.service.createMenu(req.body);
        success(res, menu, '创建菜单成功', 201);
    }
    @Put(':id')
    @IdentityRoute({ "permission": ["menu", "update"], "validation": ["menu", "updateMenu"] })
    async updateMenu(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const menu = await this.service.updateMenu(req.params.id, req.body);
        success(res, menu, '更新菜单成功');
    }
    @Delete(':id')
    @IdentityRoute({ "permission": ["menu", "delete"], "validation": ["menu", "deleteMenu"] })
    async deleteMenu(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = await this.service.deleteMenu(req.params.id);
        success(res, result, '删除菜单成功');
    }
    @Post('preview-permissions')
    @IdentityRoute({ "permission": ["menu", "create"] })
    async previewPermissions(
    @Req()
    req: any,
    @Res()
    res: Response) {
        const result = previewPermissions(req.body);
        success(res, result, '权限预览成功');
    }
}
