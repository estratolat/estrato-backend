import { PrismaService } from '../common/services/prisma.service';
export declare class EncuestasService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any, tenantId: string): Promise<({
        _count: {
            respuestas: number;
        };
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string;
        descripcion: string | null;
        status: import(".prisma/client").$Enums.EstatusEncuesta;
        created_by: string;
        preguntas: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        _count: {
            respuestas: number;
        };
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string;
        descripcion: string | null;
        status: import(".prisma/client").$Enums.EstatusEncuesta;
        created_by: string;
        preguntas: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    create(data: any, tenantId: string, userId: string): Promise<{
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string;
        descripcion: string | null;
        status: import(".prisma/client").$Enums.EstatusEncuesta;
        created_by: string;
        preguntas: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, data: any, tenantId: string): Promise<{
        _count: {
            respuestas: number;
        };
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string;
        descripcion: string | null;
        status: import(".prisma/client").$Enums.EstatusEncuesta;
        created_by: string;
        preguntas: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateStatus(id: string, status: string, tenantId: string): Promise<{
        _count: {
            respuestas: number;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string;
        descripcion: string | null;
        status: import(".prisma/client").$Enums.EstatusEncuesta;
        created_by: string;
        preguntas: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        ok: boolean;
    }>;
    createRespuesta(id: string, data: any, tenantId: string, userId?: string): Promise<{
        votante: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        votante_id: string | null;
        votante_nombre: string | null;
        respuestas: import("@prisma/client/runtime/library").JsonValue;
        encuesta_id: string;
    }>;
    findRespuestas(id: string, query: any, tenantId: string): Promise<({
        votante: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        votante_id: string | null;
        votante_nombre: string | null;
        respuestas: import("@prisma/client/runtime/library").JsonValue;
        encuesta_id: string;
    })[]>;
    resumen(id: string, tenantId: string): Promise<{
        encuesta: {
            id: string;
            titulo: string;
            status: import(".prisma/client").$Enums.EstatusEncuesta;
        };
        total_respuestas: number;
        resumen: any[];
    }>;
}
