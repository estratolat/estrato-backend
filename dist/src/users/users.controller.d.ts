import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(req: any): Promise<({
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
    getPermisosSchema(): {
        secciones: {
            id: string;
            label: string;
            icon: string;
        }[];
        roles: string[];
        defaults: {
            owner: string[];
            candidato: string[];
            coord_general: string[];
            coord_zona: string[];
            brigadista: string[];
            cm: string[];
        };
    };
    findOne(id: string, req: any): Promise<{
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
    create(data: CreateUserDto, req: any): Promise<{
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
    update(id: string, data: UpdateUserDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
}
