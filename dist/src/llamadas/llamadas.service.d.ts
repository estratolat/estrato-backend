import { PrismaService } from '../common/services/prisma.service';
import { CreateCampanaDto } from './dto/create-campana.dto';
import { UpdateCampanaDto } from './dto/update-campana.dto';
export declare class LlamadasService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private getProveedorClient;
    findAll(tenantId: string): Promise<({
        _count: {
            llamadas: number;
        };
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
        nombre: string;
        descripcion: string | null;
        status: string;
        created_by: string | null;
        script: string | null;
        voz_id_elevenlabs: string | null;
        assistant_id: string | null;
        phone_number_id: string | null;
        total_numeros: number;
        llamadas_exitosas: number;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        llamadas: ({
            votante: {
                id: string;
                telefono: string;
                nombre: string;
            };
        } & {
            id: string;
            created_at: Date;
            tenant_id: string;
            telefono: string;
            status: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            votante_id: string;
            campana_id: string;
            duracion_seg: number | null;
            transcripcion: string | null;
            sentimiento: string | null;
            audio_url: string | null;
        })[];
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
        nombre: string;
        descripcion: string | null;
        status: string;
        created_by: string | null;
        script: string | null;
        voz_id_elevenlabs: string | null;
        assistant_id: string | null;
        phone_number_id: string | null;
        total_numeros: number;
        llamadas_exitosas: number;
    }>;
    create(tenantId: string, userId: string, dto: CreateCampanaDto): Promise<{
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
        nombre: string;
        descripcion: string | null;
        status: string;
        created_by: string | null;
        script: string | null;
        voz_id_elevenlabs: string | null;
        assistant_id: string | null;
        phone_number_id: string | null;
        total_numeros: number;
        llamadas_exitosas: number;
    }>;
    update(id: string, tenantId: string, dto: UpdateCampanaDto): Promise<{
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
        nombre: string;
        descripcion: string | null;
        status: string;
        created_by: string | null;
        script: string | null;
        voz_id_elevenlabs: string | null;
        assistant_id: string | null;
        phone_number_id: string | null;
        total_numeros: number;
        llamadas_exitosas: number;
    }>;
    remove(id: string, tenantId: string): Promise<{
        ok: boolean;
    }>;
    importarVotantes(id: string, tenantId: string, votanteIds: string[]): Promise<{
        campana: {
            llamadas: ({
                votante: {
                    id: string;
                    telefono: string;
                    nombre: string;
                };
            } & {
                id: string;
                created_at: Date;
                tenant_id: string;
                telefono: string;
                status: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                votante_id: string;
                campana_id: string;
                duracion_seg: number | null;
                transcripcion: string | null;
                sentimiento: string | null;
                audio_url: string | null;
            })[];
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
            nombre: string;
            descripcion: string | null;
            status: string;
            created_by: string | null;
            script: string | null;
            voz_id_elevenlabs: string | null;
            assistant_id: string | null;
            phone_number_id: string | null;
            total_numeros: number;
            llamadas_exitosas: number;
        };
        importadas: number;
        llamadas: any[];
    }>;
    iniciarLlamada(campanaId: string, votanteId: string, tenantId: string): Promise<{
        votante: {
            id: string;
            telefono: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        telefono: string;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        votante_id: string;
        campana_id: string;
        duracion_seg: number | null;
        transcripcion: string | null;
        sentimiento: string | null;
        audio_url: string | null;
    }>;
    procesarWebhook(payload: any): Promise<{
        ok: boolean;
        reason: string;
    } | {
        ok: boolean;
        reason?: undefined;
    }>;
    getLlamadas(campanaId: string, tenantId: string): Promise<({
        votante: {
            id: string;
            telefono: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        telefono: string;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        votante_id: string;
        campana_id: string;
        duracion_seg: number | null;
        transcripcion: string | null;
        sentimiento: string | null;
        audio_url: string | null;
    })[]>;
    private limpiarTelefono;
    private normalizarStatus;
}
