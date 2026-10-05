import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthService } from '../identity/auth.service';
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = await this.auth.authenticate(req.headers.authorization);
    if (!req.user.roles.some((role: any) => ['super_admin', 'admin'].includes(role.code))) throw new ForbiddenException('需要以下角色之一: super_admin, admin');
    return true;
  }
}
