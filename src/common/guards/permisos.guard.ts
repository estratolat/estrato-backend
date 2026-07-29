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

    const request = context.switchToHttp().getRequest();
    const usuario = request.usuario;
    const jwtUser = request.user;

    if (!usuario && !jwtUser) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const rol = usuario?.rol || jwtUser?.rol;

    // Fusionar permisos del JWT y de la BD (si existen)
    const permisosDb = Array.isArray(usuario?.permisos) ? usuario.permisos : [];
    const permisosJwt = Array.isArray(jwtUser?.permisos) ? jwtUser.permisos : [];
    const permisos = Array.from(new Set([...permisosJwt, ...permisosDb]));

    console.log(
      `[PermisosGuard] ruta=${request.method} ${request.path} | rol=${rol} | requerido=${required.join(',')} | permisos=${JSON.stringify(permisos)} | db=${JSON.stringify(permisosDb)} | jwt=${JSON.stringify(permisosJwt)}`,
    );

    const tienePermiso = required.some((seccion) =>
      puedeAcceder(permisos, seccion, rol),
    );

    if (!tienePermiso) {
      throw new ForbiddenException(
        `No tienes permiso para acceder a este recurso. Se requiere alguno de: ${required.join(', ')}`,
      );
    }

    return true;
  }
}
