import {Controller,Get,Post,Put,Patch,Delete,Req,Res,UseGuards} from '@nestjs/common';
import type {Response} from 'express';
import {IdentityRoute,IdentityGuard} from '../identity/identity.guard';
import {ThirdPartyKeysService} from './third-party-keys.service';
import {shared} from '../compatibility/shared';

const ApiError = shared('utils/ApiError');
const { logger } = shared('config/logger');
const { success, paginated, created } = shared('utils/response');



@Controller('api/system/third-party-keys')
@UseGuards(IdentityGuard)
export class ThirdPartyKeysController {
 constructor(private readonly service:ThirdPartyKeysService){}
@Get('')
 @IdentityRoute({"permission": ["third-party-keys", "read"], "validation": ["third-party-keys", "listKeys"]})
 async getList(@Req() req:any,@Res() res:Response) {
  try {
    const { page, pageSize, client_name, status } = req.query;

    const result = await this.service.listKeys({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      client_name: client_name || '',
      status: status || '',
    });

    paginated(res, result.rows, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }, '获取密钥列表成功');
  } catch (error: any) {
    logger.error('Error getting API key list:', error);
    throw error;
  }
}

@Get('scopes')
 @IdentityRoute({"permission": ["third-party-keys", "read"]})
 async getScopes(@Req() req:any,@Res() res:Response) {
  success(res, this.service.listScopes(), '获取权限范围成功');
}

@Get(':id')
 @IdentityRoute({"permission": ["third-party-keys", "read"], "validation": ["third-party-keys", "keyId"]})
 async getOne(@Req() req:any,@Res() res:Response) {
  try {
    success(res, await this.service.getKey(req.params.id), '获取签名密钥成功');
  } catch (error: any) {
    throw error;
  }
}


@Post('')
 @IdentityRoute({"permission": ["third-party-keys", "create"], "validation": ["third-party-keys", "createKey"]})
 async create(@Req() req:any,@Res() res:Response) {
  try {
    const { client_name, description, expires_at, remark, scopes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized('无法获取当前用户信息');
    }

    const key = await this.service.createKey(
      {
        client_name,
        description,
        expires_at,
        remark,
        scopes,
      },
      userId
    );

    logger.info('API key created', {
      api_key: key.api_key,
      client_name: key.client_name,
      created_by: userId,
    });

    created(res, key, '密钥创建成功');
  } catch (error: any) {
    logger.error('Error creating API key:', error);
    throw error;
  }
}


@Put(':id')
 @IdentityRoute({"permission": ["third-party-keys", "update"], "validation": ["third-party-keys", "updateKey"]})
 async update(@Req() req:any,@Res() res:Response) {
  try {
    const { id } = req.params;
    const { client_name, description, remark, scopes, expires_at } = req.body;

    const key = await this.service.updateKey(id, {
      client_name,
      description,
      remark,
      scopes,
      expires_at,
    }, req.user.id);

    logger.info('API key updated', {
      id,
      client_name: key.client_name,
    });

    success(res, key, '密钥更新成功');
  } catch (error: any) {
    logger.error('Error updating API key:', error);
    throw error;
  }
}


@Patch(':id/status')
 @IdentityRoute({"permission": ["third-party-keys", "update"], "validation": ["third-party-keys", "changeStatus"]})
 async changeStatus(@Req() req:any,@Res() res:Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const key = await this.service.changeStatus(id, status, req.user.id);

    logger.info('API key status changed', {
      id,
      status,
    });

    success(res, {
      id: key.id,
      status: key.status,
    }, `密钥${status === 'active' ? '启用' : '禁用'}成功`);
  } catch (error: any) {
    logger.error('Error changing API key status:', error);
    throw error;
  }
}


@Post(':id/regenerate')
 @IdentityRoute({"permission": ["third-party-keys", "update"], "validation": ["third-party-keys", "keyId"]})
 async regenerate(@Req() req:any,@Res() res:Response) {
  try {
    const { id } = req.params;

    const result = await this.service.regenerateSecret(id, req.user.id);

    logger.warn('API secret regenerated', { id });

    success(res, result, '密钥重新生成成功');
  } catch (error: any) {
    logger.error('Error regenerating API secret:', error);
    throw error;
  }
}


@Delete(':id')
 @IdentityRoute({"permission": ["third-party-keys", "delete"], "validation": ["third-party-keys", "keyId"]})
 async delete(@Req() req:any,@Res() res:Response) {
  try {
    const { id } = req.params;

    await this.service.deleteKey(id, req.user.id);

    logger.info('API key deleted', { id });

    success(res, null, '密钥删除成功');
  } catch (error: any) {
    logger.error('Error deleting API key:', error);
    throw error;
  }
}

}
