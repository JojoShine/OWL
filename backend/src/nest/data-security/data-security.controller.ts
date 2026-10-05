import { Controller, Get, Post, Put, Delete, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { shared } from '../compatibility/shared';
import { IdentityGuard, IdentityRoute } from '../identity/identity.guard';
import { DataSecurityService } from './data-security.service';
const { success, paginated } = shared('utils/response');

@Controller('api/system/data-security')
@UseGuards(IdentityGuard)
export class DataSecurityController {
 constructor(private readonly service: DataSecurityService) {}

  @Get('fields')
 @IdentityRoute({"permission": ["sensitive-field", "read"], "validation": ["data-security", "getSensitiveFields"]})
 async getSensitiveFields(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.service.getSensitiveFields(req.query);
      paginated(res, result.data, result.pagination, '获取敏感字段列表成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Post('fields')
 @IdentityRoute({"permission": ["sensitive_field", "create"], "validation": ["data-security", "createSensitiveField"]})
 async createSensitiveField(@Req() req: any, @Res() res: Response) {
    try {
      const field = await this.service.createSensitiveField(req.body);
      success(res, field, '创建敏感字段配置成功', 201);
    } catch (error: any) {
      throw error;
    }
  }

 @Post('fields/import')
 @IdentityRoute({"permission": ["sensitive-field", "create"], "validation": ["data-security", "batchImportSensitiveFields"]})
 async batchImportSensitiveFields(@Req() req: any, @Res() res: Response) {
    try {
      const { fields } = req.body;

      if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的字段配置数组',
        });
      }

      const results = await this.service.batchImportSensitiveFields(fields);

      success(res, results, `导入完成：成功${results.success}条，失败${results.failed}条`);
    } catch (error: any) {
      throw error;
    }
  }

 @Post('validate-password')
 @IdentityRoute({"validation": ["data-security", "validatePassword"]})
 async validatePassword(@Req() req: any, @Res() res: Response) {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      await this.service.validatePasswordWithAttempts(userId, password, {
        ipAddress: req.clientIp,
        userAgent: req.get('user-agent'),
      });

      success(res, null, '密码验证成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Post('request-plain-access')
 @IdentityRoute({"validation": ["data-security", "requestPlainAccess"]})
 async requestPlainAccess(@Req() req: any, @Res() res: Response) {
    try {
      const userId = req.user.id;
      const result = await this.service.requestPlainAccess(userId, req.body, {
        ipAddress: req.clientIp,
        userAgent: req.get('user-agent'),
      });
      success(res, result, '申请成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Get('check-permission')
 @IdentityRoute({"validation": ["data-security", "checkPlainAccessPermission"]})
 async checkPlainAccessPermission(@Req() req: any, @Res() res: Response) {
    try {
      const { table_name, field_name, record_id } = req.query;
      const userId = req.user.id;

      const result = await this.service.checkPlainAccessPermission(
        userId,
        table_name,
        field_name,
        record_id
      );

      success(res, result);
    } catch (error: any) {
      throw error;
    }
  }

 @Get('statistics')
 @IdentityRoute({"permission": ["sensitive-field", "read"]})
 async getStatistics(@Req() req: any, @Res() res: Response) {
    try {
      const stats = await this.service.getStatistics();
      success(res, stats, '获取统计信息成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Get('fields/:id')
 @IdentityRoute({"permission": ["sensitive-field", "read"], "validation": ["data-security", "getSensitiveFieldById"]})
 async getSensitiveFieldById(@Req() req: any, @Res() res: Response) {
    try {
      const field = await this.service.getSensitiveFieldById(req.params.id);
      success(res, field, '获取敏感字段详情成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Put('fields/:id')
 @IdentityRoute({"permission": ["sensitive_field", "update"], "validation": ["data-security", "updateSensitiveField"]})
 async updateSensitiveField(@Req() req: any, @Res() res: Response) {
    try {
      const field = await this.service.updateSensitiveField(
        req.params.id,
        req.body
      );
      success(res, field, '更新敏感字段配置成功');
    } catch (error: any) {
      throw error;
    }
  }

 @Delete('fields/:id')
 @IdentityRoute({"permission": ["sensitive-field", "delete"], "validation": ["data-security", "deleteSensitiveField"]})
 async deleteSensitiveField(@Req() req: any, @Res() res: Response) {
    try {
      await this.service.deleteSensitiveField(req.params.id);
      success(res, null, '删除敏感字段配置成功');
    } catch (error: any) {
      throw error;
    }
  }
}
