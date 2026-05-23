import { PrismaService } from '../common/services/prisma.service';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    findBySlug(slug: string): Promise<any>;
    findById(id: string): Promise<any>;
    getOrThrow(slug: string): Promise<any>;
    create(data: {
        slug: string;
        nombre_candidato: string;
        cargo_busca?: string;
        slogan?: string;
        plan?: string;
    }): Promise<any>;
    update(id: string, data: any): Promise<any>;
    toggleVeda(id: string, veda_activa: boolean): Promise<any>;
    getStats(tenantId: string): Promise<{
        totalVotantes: any;
        totalLideres: any;
        totalEventos: any;
        totalApoyos: any;
        apoyosMes: any;
    }>;
}
