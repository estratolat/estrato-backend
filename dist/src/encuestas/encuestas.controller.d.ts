import { EncuestasService } from './encuestas.service';
export declare class EncuestasController {
    private readonly encuestasService;
    constructor(encuestasService: EncuestasService);
    findAll(query: any, req: any): Promise<({
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
    findOne(id: string, req: any): Promise<{
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
    create(data: any, req: any): Promise<{
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
    update(id: string, data: any, req: any): Promise<{
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
    updateStatus(id: string, status: string, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        ok: boolean;
    }>;
    createRespuesta(id: string, data: any, req: any): Promise<{
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
    findRespuestas(id: string, query: any, req: any): Promise<({
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
    resumen(id: string, req: any): Promise<{
        encuesta: {
            id: string;
            titulo: string;
            status: import(".prisma/client").$Enums.EstatusEncuesta;
        };
        total_respuestas: number;
        resumen: any[];
    }>;
}
