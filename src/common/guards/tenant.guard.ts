import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Obtener tenant desde header o JWT
    const tenantId = request.headers['x-tenant-id'] || user.tenant_id;

    if (!tenantId) {
      throw new ForbiddenException('Tenant no especificado');
    }

    // Verificar que el tenant existe y está activo
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, activo: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant no encontrado o inactivo');
    }

    // Verificar que el usuario pertenece al tenant
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: user.id, tenant_id: tenantId, activo: true },
    });

    if (!usuario) {
      throw new ForbiddenException('Usuario no tiene acceso a este tenant');
    }

    // Setear tenant para RLS
    await this.prisma.setTenant(tenantId);
    await this.prisma.setUserRole(usuario.rol, usuario.zona_id ? [usuario.zona_id] : undefined);

    // Adjuntar tenant y usuario al request
    request.tenant = tenant;
    request.usuario = usuario;

    return true;
  }
}
