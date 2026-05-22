import { PrismaService } from '../common/services/prisma.service';
import { Tenant } from '@prisma/client';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    findBySlug(slug: string): Promise<Tenant | null>;
    findById(id: string): Promise<Tenant | null>;
    getOrThrow(slug: string): Promise<Tenant>;
    create(data: {
        slug: string;
        nombre_candidato: string;
        cargo_busca?: string;
        slogan?: string;
        plan?: string;
    }): Promise<Tenant>;
    update(id: string, data: Partial<Tenant>): Promise<Tenant>;
    toggleVeda(id: string, veda_activa: boolean): Promise<Tenant>;
    getStats(tenantId: string): Promise<{
        totalVotantes: any;
        totalLideres: any;
        totalEventos: any;
        totalApoyos: any;
        apoyosMes: any;
    }>;
}
