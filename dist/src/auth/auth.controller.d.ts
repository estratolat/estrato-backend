import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: {
        email: string;
        password: string;
    }): Promise<{
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
    }>;
    loginBrigada(loginDto: {
        telefono: string;
        pin: string;
    }): Promise<{
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
    }>;
    getMe(req: any): Promise<{
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
}
