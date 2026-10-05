import { Controller, Post, Get, Put, Delete, Req, HttpCode, UseGuards, UnauthorizedException } from '@nestjs/common';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { ApiBuilderService } from './api-builder.service';
import { ApiExecutorService } from './api-executor.service';
import { SqlApiKeysService } from './api-key.service';
@Controller('api/system/api-builder')
@UseGuards(IdentityGuard)
export class ApiExecutorController {
    constructor(private readonly builder: ApiBuilderService, private readonly executor: ApiExecutorService, private readonly keys: SqlApiKeysService) { }
    @Post('test/:id')
    @HttpCode(200)
    @IdentityRoute({ permission: ['api-interface', 'read'] })
    async test(
    @Req()
    req: any) { if (req.headers['x-api-key'])
        await this.keys.authenticate(req.headers['x-api-key']); const definition = await this.builder.getInterfaceById(req.params.id), rows = await this.executor.testInterface(definition, req.body.params || {}, req.clientIp); return { success: true, message: '接口测试成功', data: { rows, rowCount: Array.isArray(rows) ? rows.length : 0 } }; }
}
@Controller('api/custom')
export class CustomApiController {
    constructor(private readonly builder: ApiBuilderService, private readonly executor: ApiExecutorService, private readonly keys: SqlApiKeysService) { }
    async execute(req: any) { const key = req.headers['x-api-key'] ? await this.keys.authenticate(req.headers['x-api-key']) : null; const endpoint = '/custom/' + (Array.isArray(req.params.endpoint) ? req.params.endpoint.join('/') : req.params.endpoint || ''); const definition = await this.builder.findInterface(endpoint, parseInt(req.query.version) || 1, req.method); if (definition.require_auth) {
        if (!key)
            throw new UnauthorizedException('未提供有效的API密钥');
        await this.keys.authorizeInterface(key, definition);
    } const params = { ...req.query, ...req.body }; delete params.version; delete params.api_key; const data = await this.executor.executeInterface(definition, params, req.clientIp, key?.id); return { success: true, message: '接口调用成功', data, meta: { endpoint: definition.endpoint, version: definition.version, rowCount: Array.isArray(data) ? data.length : 0, timestamp: new Date().toISOString() } }; }
    @Get('*endpoint')
    get(
    @Req()
    req: any) { return this.execute(req); }
    @Post('*endpoint')
    @HttpCode(200)
    post(
    @Req()
    req: any) { return this.execute(req); }
    @Put('*endpoint')
    put(
    @Req()
    req: any) { return this.execute(req); }
    @Delete('*endpoint')
    delete(
    @Req()
    req: any) { return this.execute(req); }
}
