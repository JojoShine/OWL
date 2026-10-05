import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { MetricsService } from './metrics.service';
import { EmailService } from '../notification/email.service';
import { shared } from '../compatibility/shared';
const { success } = shared('utils/response');
@Controller('api/system/monitor')
@UseGuards(IdentityGuard)
export class MonitorController {
    constructor(private readonly metrics: MetricsService, private readonly email: EmailService) { }
    @Get('status')
    @IdentityRoute({ public: true })
    status(
    @Res()
    res: Response) { const redis = shared('config/redis').isRedisAvailable(), email = this.email.isEmailAvailable(); return success(res, { redis: { available: redis, message: redis ? 'Redis 服务正常' : 'Redis 服务不可用，系统使用内存存储作为备选方案' }, email: { available: email, message: email ? '邮件服务正常' : '邮件服务未配置，请配置 SMTP 相关环境变量' } }, '系统状态获取成功'); }
    @Get('system')
    @IdentityRoute({ permission: ['monitor', 'read'] })
    async system(
    @Res()
    res: Response) { return success(res, await this.metrics.getSystemMetrics(), '获取系统指标成功'); }
    @Get('application')
    @IdentityRoute({ permission: ['monitor', 'read'] })
    application(
    @Res()
    res: Response) { return success(res, this.metrics.getApplicationMetrics(), '获取应用指标成功'); }
    @Get('database')
    @IdentityRoute({ permission: ['monitor', 'read'] })
    async database(
    @Res()
    res: Response) { return success(res, await this.metrics.getDatabaseMetrics(), '获取数据库指标成功'); }
    @Get('cache')
    @IdentityRoute({ permission: ['monitor', 'read'] })
    async cache(
    @Res()
    res: Response) { return success(res, await this.metrics.getCacheMetrics(), '获取缓存指标成功'); }
    @Get('all')
    @IdentityRoute({ permission: ['monitor', 'read'] })
    async all(
    @Res()
    res: Response) { const [system, application, database, cache] = await Promise.all([this.metrics.getSystemMetrics(), this.metrics.getApplicationMetrics(), this.metrics.getDatabaseMetrics(), this.metrics.getCacheMetrics()]); return success(res, { system, application, database, cache, timestamp: new Date() }, '获取综合指标成功'); }
}
