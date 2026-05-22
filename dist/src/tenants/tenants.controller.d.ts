import { TenantsService } from './tenants.service';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    getBySlug(slug: string): Promise<Tenant>;
    getStats(slug: string): Promise<{
        totalVotantes: any;
        totalLideres: any;
        totalEventos: any;
        totalApoyos: any;
        apoyosMes: any;
    }>;
    getLandingData(slug: string): Promise<{
        tenant: {
            slug: any;
            nombre_candidato: any;
            cargo_busca: any;
            slogan: any;
        };
        stats: {
            totalSimpatizantes: any;
            totalEventos: any;
        };
    }>;
    create(data: {
        slug: string;
        nombre_candidato: string;
        cargo_busca?: string;
        slogan?: string;
    }): Promise<Tenant>;
    toggleVeda(id: string, veda_activa: boolean): Promise<Tenant>;
}
