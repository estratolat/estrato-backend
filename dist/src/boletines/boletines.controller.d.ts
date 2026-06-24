import { Request } from 'express';
import { BoletinesService } from './boletines.service';
import { CreateBoletinDto } from './dto/create-boletin.dto';
import { GenerarBoletinDto } from './dto/generar-boletin.dto';
interface RequestConTenant extends Request {
    tenant: {
        id: string;
    };
    usuario: {
        id: string;
    };
}
export declare class BoletinesController {
    private readonly boletinesService;
    constructor(boletinesService: BoletinesService);
    findAll(req: RequestConTenant): Promise<({
        creador: {
            id: string;
            email: string;
            nombre: string;
        };
        aprobador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string | null;
        created_by: string;
        prompt_usuario: string;
        bajada: string | null;
        desarrollo: string | null;
        copy_generado: string | null;
        caption_redes: string | null;
        imagen_url: string | null;
        aprobado: boolean;
        versiones_redes: import("@prisma/client/runtime/library").JsonValue | null;
        aprobado_por: string | null;
        fecha_publicacion: Date | null;
    })[]>;
    create(data: CreateBoletinDto, req: RequestConTenant): Promise<{
        creador: {
            id: string;
            email: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string | null;
        created_by: string;
        prompt_usuario: string;
        bajada: string | null;
        desarrollo: string | null;
        copy_generado: string | null;
        caption_redes: string | null;
        imagen_url: string | null;
        aprobado: boolean;
        versiones_redes: import("@prisma/client/runtime/library").JsonValue | null;
        aprobado_por: string | null;
        fecha_publicacion: Date | null;
    }>;
    generar(data: GenerarBoletinDto, req: RequestConTenant): Promise<{
        boletin: {
            creador: {
                id: string;
                email: string;
                nombre: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            tenant_id: string;
            titulo: string | null;
            created_by: string;
            prompt_usuario: string;
            bajada: string | null;
            desarrollo: string | null;
            copy_generado: string | null;
            caption_redes: string | null;
            imagen_url: string | null;
            aprobado: boolean;
            versiones_redes: import("@prisma/client/runtime/library").JsonValue | null;
            aprobado_por: string | null;
            fecha_publicacion: Date | null;
        };
        titulo?: string;
        bajada?: string;
        desarrollo?: string;
        texto?: string;
        caption?: string;
        hashtags?: string[];
        idea_imagen?: string;
        versiones_redes?: {
            caption: string;
            hashtags: string[];
            idea_imagen: string;
        }[];
    }>;
    aprobar(id: string, req: RequestConTenant): Promise<{
        creador: {
            id: string;
            nombre: string;
        };
        aprobador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string | null;
        created_by: string;
        prompt_usuario: string;
        bajada: string | null;
        desarrollo: string | null;
        copy_generado: string | null;
        caption_redes: string | null;
        imagen_url: string | null;
        aprobado: boolean;
        versiones_redes: import("@prisma/client/runtime/library").JsonValue | null;
        aprobado_por: string | null;
        fecha_publicacion: Date | null;
    }>;
    rechazar(id: string, req: RequestConTenant): Promise<{
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string | null;
        created_by: string;
        prompt_usuario: string;
        bajada: string | null;
        desarrollo: string | null;
        copy_generado: string | null;
        caption_redes: string | null;
        imagen_url: string | null;
        aprobado: boolean;
        versiones_redes: import("@prisma/client/runtime/library").JsonValue | null;
        aprobado_por: string | null;
        fecha_publicacion: Date | null;
    }>;
}
export {};
