import { PrismaService } from '../common/services/prisma.service';
export declare class ProyeccionService {
    private prisma;
    constructor(prisma: PrismaService);
    findMetas(query: any, tenantId: string): Promise<({
        zona: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        zona_id: string | null;
        meta_votos: number;
        seccion: string | null;
        proceso: string;
        meta_lista_nominal: number | null;
        meta_participacion: number | null;
    })[]>;
    createMeta(data: any, tenantId: string): Promise<{
        zona: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        zona_id: string | null;
        meta_votos: number;
        seccion: string | null;
        proceso: string;
        meta_lista_nominal: number | null;
        meta_participacion: number | null;
    }>;
    updateMeta(id: string, data: any, tenantId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        zona_id: string | null;
        meta_votos: number;
        seccion: string | null;
        proceso: string;
        meta_lista_nominal: number | null;
        meta_participacion: number | null;
    }>;
    removeMeta(id: string, tenantId: string): Promise<{
        ok: boolean;
    }>;
    resumen(tenantId: string): Promise<{
        votantes_registrados: number;
        apoyos_registrados: number;
        lideres_registrados: number;
        meta_votos_total: number;
        brecha: number;
    }>;
    porSeccion(tenantId: string): Promise<any[]>;
}
