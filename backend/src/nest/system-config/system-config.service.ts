import { BadRequestException, Injectable } from '@nestjs/common';
import Joi from 'joi';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';

const editableConfig = Joi.object({
  logo_url: Joi.string().max(500).allow(null, ''),
  login_bg_url: Joi.string().max(500).allow(null, ''),
  company_name: Joi.string().max(100).allow(''),
  system_name: Joi.string().max(100).allow(''),
  show_tech_stack: Joi.boolean(), registration_enabled: Joi.boolean(), enable_theme_switch: Joi.boolean(),
  login_method: Joi.string().valid('password', 'sms', 'both'),
  registration_method: Joi.string().valid('password', 'sms', 'both'),
  login_layout: Joi.string().valid('center', 'left-image', 'right-image'),
  theme_mode: Joi.string().valid('light', 'dark', 'auto'),
  primary_color: Joi.string().max(20).allow(''),
  tech_stack_info: Joi.any().allow(null),
}).required();

@Injectable()
export class SystemConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    const where = { id: 1n, deletedAt: null };
    const existing = await this.prisma.owl_system_configs.findFirst({ where });
    if (existing) return existing;
    try {
      return await this.prisma.owl_system_configs.create({ data: {
        id: 1n, company_name: 'Owl Platform', system_name: 'Owl Platform',
        show_tech_stack: true, enable_theme_switch: true, theme_mode: 'auto', primary_color: 'default',
      } });
    } catch (error: any) {
      // Two anonymous login pages may request the initial singleton concurrently.
      if (error.code === 'P2002') {
        const created = await this.prisma.owl_system_configs.findFirst({ where });
        if (created) return created;
      }
      throw error;
    }
  }

  async updateConfig(body: unknown, userId: string) {
    const { error, value } = editableConfig.validate(body, { stripUnknown: true, convert: false });
    if (error) throw new BadRequestException('配置数据不合法');
    await this.getConfig();
    if (value.tech_stack_info === null) value.tech_stack_info = Prisma.DbNull;
    return this.prisma.owl_system_configs.update({ where: { id: 1n }, data: {
      ...value, created_by: userId, updatedAt: new Date(),
    } });
  }

  async setImage(field: 'logo_url' | 'login_bg_url', url: string) {
    if (!url) throw new BadRequestException('文件URL不能为空');
    await this.getConfig();
    return this.prisma.owl_system_configs.update({ where: { id: 1n }, data: { [field]: url, updatedAt: new Date() } });
  }
}
