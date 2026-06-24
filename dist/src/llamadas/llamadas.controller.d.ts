import { LlamadasService } from './llamadas.service';
import { CreateCampanaDto } from './dto/create-campana.dto';
import { UpdateCampanaDto } from './dto/update-campana.dto';
import { ImportarVotantesDto } from './dto/importar-votantes.dto';
import { IniciarLlamadaDto } from './dto/iniciar-llamada.dto';
export declare class LlamadasController {
    private readonly llamadasService;
    constructor(llamadasService: LlamadasService);
    private tenantId;
    getCampanas(req: any): Promise<({
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
    createCampana(dto: CreateCampanaDto, req: any): Promise<{
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
    getCampana(id: string, req: any): Promise<{
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
    updateCampana(id: string, dto: UpdateCampanaDto, req: any): Promise<{
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
    deleteCampana(id: string, req: any): Promise<{
        ok: boolean;
    }>;
    importarVotantes(id: string, dto: ImportarVotantesDto, req: any): Promise<{
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
    iniciarLlamada(id: string, dto: IniciarLlamadaDto, req: any): Promise<{
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
    getLlamadas(id: string, req: any): Promise<({
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
    webhook(payload: any, headers: Record<string, string>): Promise<{
        ok: boolean;
        reason: string;
    } | {
        ok: boolean;
        reason?: undefined;
    }>;
}
