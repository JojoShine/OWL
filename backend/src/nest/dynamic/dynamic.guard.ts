import { Injectable, CanActivate, ExecutionContext, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../identity/auth.service';
import { ModuleConfigService } from './module-config.service';
export const DynamicAction = (action: string) => SetMetadata('dynamic-action', action);
@Injectable()
export class DynamicGuard implements CanActivate {
    constructor(private readonly auth: AuthService, private readonly configs: ModuleConfigService, private readonly reflector: Reflector) { }
    async canActivate(context: ExecutionContext) { const req = context.switchToHttp().getRequest(); req.user = await this.auth.authenticate(req.headers.authorization); req.moduleConfig = await this.configs.getModuleConfigByPath(req.params.modulePath); const action = this.reflector.get<string>('dynamic-action', context.getHandler()), resource = req.moduleConfig.module_path; if (!req.user.roles.some((role: any) => role.permissions?.some((permission: any) => permission.resource === resource && permission.action === action)))
        throw new ForbiddenException(`没有权限执行此操作: ${action} ${resource}`); return true; }
}
