import { PrismaService } from '../common/services/prisma.service';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    findBySlug(slug: string): Promise<{
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
    }>;
    findById(id: string): Promise<{
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
    }>;
    getOrThrow(slug: string): Promise<{
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
    }>;
    create(data: {
        slug: string;
        nombre_candidato: string;
        cargo_busca?: string;
        slogan?: string;
        plan?: string;
    }): Promise<{
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
    }>;
    getLandingData(slug: string): Promise<{
        tenant: {
            slug: string;
            nombre_candidato: string;
            cargo_busca: string;
            slogan: string;
        };
        stats: {
            totalSimpatizantes: number;
            totalEventos: number;
        };
        eventos: {
            id: string;
            nombre: string;
            descripcion: string;
            direccion: string;
            fecha: Date;
            coordenadas: import("@prisma/client/runtime/library").JsonValue;
        }[];
    }>;
    update(id: string, data: any): Promise<{
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
    }>;
    toggleVeda(id: string, veda_activa: boolean): Promise<{
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
    }>;
    getStats(tenantId: string): Promise<{
        totalVotantes: number;
        totalLideres: number;
        totalEventos: number;
        totalApoyos: number;
        apoyosMes: number;
    }>;
}
