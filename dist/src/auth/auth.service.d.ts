import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/services/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    validateBrigadaUser(telefono: string, pin: string): Promise<any>;
    login(user: any): {
        access_token: string;
        user: {
            id: any;
            email: any;
            nombre: any;
            rol: any;
            tenant_id: any;
            tenant_slug: any;
            zona_id: any;
            permisos: any;
        };
    };
    getMe(userId: string): Promise<{
        tenant: {
            id: string;
            slug: string;
            dominio_personalizado: string | null;
            url_completa: string;
            nombre_candidato: string;
            cargo_busca: string | null;
            slogan: string | null;
            plan: string;
            veda_activa: boolean;
            activo: boolean;
            created_at: Date;
            updated_at: Date;
        };
        zona: {
            id: string;
            nombre: string;
        };
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        email: string;
        tenant_id: string;
        telefono: string | null;
        pin: string | null;
        nombre: string | null;
        rol: import(".prisma/client").$Enums.UserRole;
        zona_id: string | null;
        permisos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    private permisosPorRol;
}
