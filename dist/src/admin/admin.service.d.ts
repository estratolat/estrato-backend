import { PrismaService } from '../common/services/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
export declare class AdminService {
    private prisma;
    private tenantsService;
    private readonly logger;
    constructor(prisma: PrismaService, tenantsService: TenantsService);
    createProject(data: {
        slug: string;
        nombre_candidato: string;
        cargo_busca?: string;
        slogan?: string;
        owner_email: string;
        owner_nombre: string;
        owner_password: string;
    }): Promise<{
        tenant: {
            id: string;
            slug: string;
            nombre_candidato: string;
            cargo_busca: string;
            slogan: string;
            plan: string;
            activo: boolean;
            created_at: Date;
        };
        owner: {
            id: string;
            email: string;
            nombre: string;
            rol: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    listProjects(): Promise<{
        id: string;
        slug: string;
        nombre_candidato: string;
        cargo_busca: string;
        slogan: string;
        plan: string;
        activo: boolean;
        created_at: Date;
        stats: {
            usuarios: number;
            votantes: number;
            lideres: number;
            eventos: number;
        };
    }[]>;
    getProject(id: string): Promise<{
        id: string;
        slug: string;
        nombre_candidato: string;
        cargo_busca: string;
        slogan: string;
        plan: string;
        activo: boolean;
        created_at: Date;
        usuarios: {
            id: string;
            activo: boolean;
            created_at: Date;
            email: string;
            nombre: string;
            rol: import(".prisma/client").$Enums.UserRole;
        }[];
        stats: {
            votantes: number;
            lideres: number;
            eventos: number;
        };
    }>;
}
