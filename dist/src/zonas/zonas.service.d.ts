import { PrismaService } from '../common/services/prisma.service';
export declare class ZonasService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<({
        lider: {
            votante: {
                id: string;
                nombre: string;
            };
        } & {
            id: string;
            activo: boolean;
            created_at: Date;
            updated_at: Date;
            tenant_id: string;
            votante_id: string;
            lider_padre_id: string | null;
            alcance_estimado: number | null;
            score: number;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        nombre: string;
        secciones: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        color: string;
        activa: boolean;
        tipo: import(".prisma/client").$Enums.ZonaTipo;
        lider_id: string | null;
        meta_votos: number | null;
        votos_estimados: number | null;
        descripcion: string | null;
        orden: number;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        lider: {
            votante: {
                id: string;
                nombre: string;
            };
        } & {
            id: string;
            activo: boolean;
            created_at: Date;
            updated_at: Date;
            tenant_id: string;
            votante_id: string;
            lider_padre_id: string | null;
            alcance_estimado: number | null;
            score: number;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        nombre: string;
        secciones: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        color: string;
        activa: boolean;
        tipo: import(".prisma/client").$Enums.ZonaTipo;
        lider_id: string | null;
        meta_votos: number | null;
        votos_estimados: number | null;
        descripcion: string | null;
        orden: number;
    }>;
    create(data: any, tenantId: string, userId?: string): Promise<{
        lider: {
            votante: {
                id: string;
                nombre: string;
            };
        } & {
            id: string;
            activo: boolean;
            created_at: Date;
            updated_at: Date;
            tenant_id: string;
            votante_id: string;
            lider_padre_id: string | null;
            alcance_estimado: number | null;
            score: number;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        nombre: string;
        secciones: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        color: string;
        activa: boolean;
        tipo: import(".prisma/client").$Enums.ZonaTipo;
        lider_id: string | null;
        meta_votos: number | null;
        votos_estimados: number | null;
        descripcion: string | null;
        orden: number;
    }>;
    update(id: string, data: any, tenantId: string, userId?: string): Promise<{
        lider: {
            votante: {
                id: string;
                nombre: string;
            };
        } & {
            id: string;
            activo: boolean;
            created_at: Date;
            updated_at: Date;
            tenant_id: string;
            votante_id: string;
            lider_padre_id: string | null;
            alcance_estimado: number | null;
            score: number;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        nombre: string;
        secciones: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        color: string;
        activa: boolean;
        tipo: import(".prisma/client").$Enums.ZonaTipo;
        lider_id: string | null;
        meta_votos: number | null;
        votos_estimados: number | null;
        descripcion: string | null;
        orden: number;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        nombre: string;
        secciones: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        color: string;
        activa: boolean;
        tipo: import(".prisma/client").$Enums.ZonaTipo;
        lider_id: string | null;
        meta_votos: number | null;
        votos_estimados: number | null;
        descripcion: string | null;
        orden: number;
    }>;
    private normalizar;
    private validarPolygon;
    private parsearEntero;
}
