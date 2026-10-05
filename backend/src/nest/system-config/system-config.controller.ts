import { UploadsService } from '../storage/uploads.service';
import { BadRequestException, Body, Controller, Get, HttpCode, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SystemConfigService } from './system-config.service';
import { AdminGuard } from '../compatibility/admin.guard';
import { shared } from '../compatibility/shared';
import { success } from '../response';

@Controller('api/system/system-config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService, private readonly uploads: UploadsService) {}
  @Get()
  async getConfig() { return success(await this.service.getConfig(), '获取系统配置成功'); }

  @Put()
  @UseGuards(AdminGuard)
  async updateConfig(@Body() body: unknown, @Req() req: any) {
    return success(await this.service.updateConfig(body, req.user.id), '更新系统配置成功');
  }

  private async upload(req: Request, res: Response, field: 'logo_url' | 'login_bg_url', category: string) {
    await new Promise<void>((resolve, reject) => shared('http/upload').uploadSingle('file')(req, res, (error?: Error) => error ? reject(error) : resolve()));
    const file = (req as any).file;
    if (!file) throw new BadRequestException('没有找到上传的文件');
    const url = await this.uploads.uploadFile(file.buffer, file.originalname, file.mimetype, category, null);
    await this.service.setImage(field, url);
    return url;
  }

  @Post('logo')
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async logo(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return success({ url: await this.upload(req, res, 'logo_url', 'logo') }, 'Logo 上传成功');
  }

  @Post('login-bg')
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async background(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return success({ url: await this.upload(req, res, 'login_bg_url', 'background') }, '登录背景上传成功');
  }
}
