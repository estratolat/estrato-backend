import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_REQUERIDOS_KEY } from '../decorators/permisos.decorator';
import { puedeAcceder } from '../helpers/permisos.helper';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISOS_REQUERIDOS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const { usuario } = context.switchToHttp().getRequest();

    if (!usuario) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const permisos = Array.isArray(usuario.permisos) ? usuario.permisos : [];
    const tienePermiso = required.some((seccion) =>
      puedeAcceder(permisos, seccion, usuario.rol),
    );

    if (!tienePermiso) {
      throw new ForbiddenException('No tienes permiso para acceder a este recurso');
    }

    return true;
  }
}
