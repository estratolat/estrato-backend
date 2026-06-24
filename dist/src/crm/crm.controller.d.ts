import { Response } from 'express';
import { Request } from 'express';
import { CrmService } from './crm.service';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../common/services/prisma.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { FiltersMensajesDto } from './dto/filters-mensajes.dto';
interface RequestConTenant extends Request {
    tenant: {
        id: string;
    };
    usuario: {
        id: string;
    };
}
export declare class CrmController {
    private readonly crmService;
    private readonly messagingService;
    private readonly prisma;
    constructor(crmService: CrmService, messagingService: MessagingService, prisma: PrismaService);
    getConversaciones(filters: FiltersMensajesDto, req: RequestConTenant): Promise<any[]>;
    getMensajes(filters: FiltersMensajesDto, req: RequestConTenant): Promise<({
        votante: {
            id: string;
            email: string;
            telefono: string;
            nombre: string;
            colonia: string;
            metadata: import("@prisma/client/runtime/library").JsonValue;
        };
        atendedor: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        direccion: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        votante_id: string;
        id_externo: string | null;
        canal: string;
        contenido: string;
        template_usado: string | null;
        tags_auto: string[];
        atendido_por: string | null;
        tiempo_respuesta_seg: number | null;
        leido: boolean;
    })[]>;
    enviarMensaje(data: CreateMensajeDto, req: RequestConTenant): Promise<{
        votante: {
            id: string;
            telefono: string;
            nombre: string;
        };
        atendedor: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        direccion: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        votante_id: string;
        id_externo: string | null;
        canal: string;
        contenido: string;
        template_usado: string | null;
        tags_auto: string[];
        atendido_por: string | null;
        tiempo_respuesta_seg: number | null;
        leido: boolean;
    }>;
    marcarLeido(id: string, req: RequestConTenant): Promise<{
        votante: {
            id: string;
            telefono: string;
            nombre: string;
        };
        atendedor: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        direccion: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        votante_id: string;
        id_externo: string | null;
        canal: string;
        contenido: string;
        template_usado: string | null;
        tags_auto: string[];
        atendido_por: string | null;
        tiempo_respuesta_seg: number | null;
        leido: boolean;
    }>;
    getStats(req: RequestConTenant): Promise<{
        total: number;
        pendientes: number;
        porCanal: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.MensajeGroupByOutputType, ("direccion" | "canal")[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
    recibirWebhook(tenantSlug: string, payload: any): Promise<{
        recibidos: number;
        guardados: number;
    }>;
    verificarWebhook(tenantSlug: string, mode: string, verifyToken: string, challenge: string, res: Response): Promise<void>;
}
export {};
