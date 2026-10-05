import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { shared } from '../compatibility/shared';
export type IdentityPolicy = {
    public?: boolean;
    schema?: Record<string, unknown>;
    upload?: { field: string; multiple?: boolean; max?: number };
    permission?: [
        string,
        string
    ];
    roles?: string[];
    validation?: [
        string,
        string
    ];
};
export const IdentityRoute = (policy: IdentityPolicy) => SetMetadata('identity-policy', policy);
@Injectable()
export class IdentityGuard implements CanActivate {
    constructor(private readonly auth: AuthService, private readonly reflector: Reflector) { }
    async canActivate(context: ExecutionContext) {
        const policy = this.reflector.get<IdentityPolicy>('identity-policy', context.getHandler()) || {};
        const req = context.switchToHttp().getRequest();
        if (!policy.public) {
            req.user = await this.auth.authenticate(req.headers.authorization);
            if (policy.roles && !req.user.roles.some((role: any) => policy.roles!.includes(role.code)))
                throw new ForbiddenException(`需要以下角色之一: ${policy.roles.join(', ')}`);
            if (policy.permission) {
                const [resource, action] = policy.permission;
                if (!req.user.roles.some((role: any) => role.permissions?.some((permission: any) => permission.resource === resource && permission.action === action)))
                    throw new ForbiddenException(`没有权限执行此操作: ${action} ${resource}`);
            }
        }
        if (policy.upload) {
            const {field,multiple,max}=policy.upload;
            const middleware=shared('http/upload');
            await new Promise<void>((resolve,reject)=>(multiple?middleware.uploadMultiple(field,max||10):middleware.uploadSingle(field))(req,context.switchToHttp().getResponse(),(error?:Error)=>error?reject(error):resolve()));
        }
        if (policy.schema) {
            await new Promise<void>((resolve,reject)=>shared('http/validate')(policy.schema)(req,context.switchToHttp().getResponse(),(error?:Error)=>error?reject(error):resolve()));
        }
        if (policy.validation) {
            const [module, method] = policy.validation;
            if (module === 'api-builder') {
                const validation = shared('validation/api-builder');
                for (const rule of validation[method]()) await rule.run(req);
                await new Promise<void>((resolve,reject)=>validation.handleValidationErrors(req,context.switchToHttp().getResponse(),(error?:Error)=>error?reject(error):resolve()));
                return true;
            }
            const schema = shared(`validation/${module}`)[method];
            if (Array.isArray(schema)) {
                for (const rule of schema) await rule.run(req);
                const result = require('express-validator').validationResult(req);
                if (!result.isEmpty()) throw shared('utils/ApiError').validationError('参数验证失败', result.array().map((error:any)=>({field:error.path,message:error.msg})));
                return true;
            }

            await new Promise<void>((resolve, reject) => shared('http/validate')(schema)(req, context.switchToHttp().getResponse(), (error?: Error) => error ? reject(error) : resolve()));
        }
        return true;
    }
}
