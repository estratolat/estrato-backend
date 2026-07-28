import { SetMetadata } from '@nestjs/common';

export const PERMISOS_REQUERIDOS_KEY = 'permisos_requeridos';

export const RequierePermiso = (...permisos: string[]) =>
  SetMetadata(PERMISOS_REQUERIDOS_KEY, permisos);
