import { AdminService } from './admin.service';
import { CreateProjectDto } from './dto/create-project.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
    createProject(data: CreateProjectDto): Promise<{
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
    limpiarCapasExternas(): Promise<{
        eliminadas: number;
        tipos: readonly ["inegi", "colonia"];
        mensaje: string;
    }>;
}
