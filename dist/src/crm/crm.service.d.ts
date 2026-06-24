import { PrismaService } from '../common/services/prisma.service';
import { MessagingService } from './messaging.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { FiltersMensajesDto } from './dto/filters-mensajes.dto';
export declare class CrmService {
    private prisma;
    private messaging;
    constructor(prisma: PrismaService, messaging: MessagingService);
    getConversaciones(tenantId: string, filters: FiltersMensajesDto): Promise<any[]>;
    getMensajes(tenantId: string, filters: FiltersMensajesDto): Promise<({
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
    enviarMensaje(tenantId: string, userId: string, data: CreateMensajeDto): Promise<{
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
    marcarLeido(id: string, tenantId: string, userId?: string): Promise<{
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
    procesarWebhook(tenantId: string, payload: any): Promise<{
        recibidos: number;
        guardados: number;
    }>;
    private obtenerOCrearVotanteDesdeExterno;
    private buscarVotantePorMetadata;
    getStats(tenantId: string): Promise<{
        total: number;
        pendientes: number;
        porCanal: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.MensajeGroupByOutputType, ("direccion" | "canal")[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
    private normalizarTelefono;
    private hashSimple;
}
