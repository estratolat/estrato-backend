import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    const result = super.handleRequest(err, user, info, context, status);
    const req = context.switchToHttp().getRequest();
    req.usuario = result
      ? {
          id: result.userId,
          userId: result.userId,
          email: result.email,
          rol: result.rol,
          tenant_id: result.tenant_id,
          tenant_slug: result.tenant_slug,
          permisos: result.permisos || [],
        }
      : null;
    return result;
  }
}
