import { PrismaService } from '../common/services/prisma.service';
import { AnthropicService } from '../common/services/anthropic.service';
import { TranscripcionService } from '../common/services/transcripcion.service';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
export declare class CandidatoService {
    private prisma;
    private anthropic;
    private transcripcion;
    constructor(prisma: PrismaService, anthropic: AnthropicService, transcripcion: TranscripcionService);
    getPerfil(tenantId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        nombre: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        biografia: string | null;
        gustos: string | null;
        discurso: string | null;
        video_url: string | null;
        video_transcripcion: string | null;
        palabras_clave: string[];
        muletillas: string[];
        frases_recurrentes: string[];
        llamados_accion: string[];
        tono: string | null;
        propuesta_central: string | null;
        estilo_redes: string | null;
        analizado_en: Date | null;
    }>;
    upsertPerfil(tenantId: string, data: UpdatePerfilDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        nombre: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        biografia: string | null;
        gustos: string | null;
        discurso: string | null;
        video_url: string | null;
        video_transcripcion: string | null;
        palabras_clave: string[];
        muletillas: string[];
        frases_recurrentes: string[];
        llamados_accion: string[];
        tono: string | null;
        propuesta_central: string | null;
        estilo_redes: string | null;
        analizado_en: Date | null;
    }>;
    analizar(tenantId: string, transcribirVideo?: boolean): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        nombre: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        biografia: string | null;
        gustos: string | null;
        discurso: string | null;
        video_url: string | null;
        video_transcripcion: string | null;
        palabras_clave: string[];
        muletillas: string[];
        frases_recurrentes: string[];
        llamados_accion: string[];
        tono: string | null;
        propuesta_central: string | null;
        estilo_redes: string | null;
        analizado_en: Date | null;
    }>;
    generarContenido(tenantId: string, tipo: 'boletin' | 'redes', contexto: ContextoGeneracion): Promise<{
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
}
export interface ContextoGeneracion {
    tema?: string;
    que?: string;
    quien?: string;
    como?: string;
    cuando?: string;
    donde?: string;
    por_que?: string;
    para_que?: string;
}
