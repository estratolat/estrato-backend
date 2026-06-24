import { PrismaService } from '../common/services/prisma.service';
import { UserRole } from '@prisma/client';
export declare const SECCIONES_DISPONIBLES: {
    id: string;
    label: string;
    icon: string;
}[];
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<({
        zona: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        email: string;
        tenant_id: string;
        telefono: string | null;
        pin: string | null;
        nombre: string | null;
        password_hash: string | null;
        rol: import(".prisma/client").$Enums.UserRole;
        zona_id: string | null;
        permisos: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        zona: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        email: string;
        tenant_id: string;
        telefono: string | null;
        pin: string | null;
        nombre: string | null;
        password_hash: string | null;
        rol: import(".prisma/client").$Enums.UserRole;
        zona_id: string | null;
        permisos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    create(data: any, tenantId: string, creadorId?: string): Promise<{
        zona: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        email: string;
        tenant_id: string;
        telefono: string | null;
        pin: string | null;
        nombre: string | null;
        password_hash: string | null;
        rol: import(".prisma/client").$Enums.UserRole;
        zona_id: string | null;
        permisos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, data: any, tenantId: string): Promise<{
        zona: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        email: string;
        tenant_id: string;
        telefono: string | null;
        pin: string | null;
        nombre: string | null;
        password_hash: string | null;
        rol: import(".prisma/client").$Enums.UserRole;
        zona_id: string | null;
        permisos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string, tenantId: string, ejecutorId?: string): Promise<{
        zona: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        email: string;
        tenant_id: string;
        telefono: string | null;
        pin: string | null;
        nombre: string | null;
        password_hash: string | null;
        rol: import(".prisma/client").$Enums.UserRole;
        zona_id: string | null;
        permisos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    permisosPorRol(rol: UserRole): string[];
    private normalizar;
}
