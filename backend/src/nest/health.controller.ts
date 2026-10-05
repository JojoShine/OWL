import { Controller, Get } from '@nestjs/common';
import { success } from './response';

@Controller()
export class HealthController {
  @Get('health')
  health() { return success({ status: 'ok' }, 'Server is running'); }
  @Get('api/health')
  apiHealth() { return { success: true, message: 'API is running', timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' }; }
}
