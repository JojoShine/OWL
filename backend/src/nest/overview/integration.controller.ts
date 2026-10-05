import { Controller, Get, Req } from '@nestjs/common';
import { IntegrationService } from './integration.service';
@Controller('api/public/integration')
export class IntegrationController {
    constructor(private readonly service: IntegrationService) { }
    @Get('ping')
    async ping(
    @Req()
    req: any) { return { success: true, data: await this.service.ping(req), message: '签名验证成功', timestamp: new Date().toISOString() }; }
}
