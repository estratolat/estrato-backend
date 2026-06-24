import { UserRole } from '@prisma/client';

export class UserResponseDto {
  id: string;
  tenant_id: string;
  email: string;
  telefono: string | null;
  nombre: string | null;
  rol: UserRole;
  zona_id: string | null;
  permisos: string[] | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  zona?: { id: string; nombre: string } | null;
}
