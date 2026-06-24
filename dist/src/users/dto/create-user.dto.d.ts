import { UserRole } from '@prisma/client';
export declare class CreateUserDto {
    email: string;
    nombre: string;
    telefono?: string;
    pin?: string;
    password?: string;
    rol: UserRole;
    zona_id?: string;
    permisos?: string[];
    activo?: boolean;
}
