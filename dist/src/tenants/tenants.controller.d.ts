import { TenantsService } from './tenants.service';
import { VotantesService } from '../votantes/votantes.service';
export declare class TenantsController {
    private readonly tenantsService;
    private readonly votantesService;
    constructor(tenantsService: TenantsService, votantesService: VotantesService);
    getBySlug(slug: string): Promise<{
        id: string;
        slug: string;
        dominio_personalizado: string | null;
        url_completa: string;
        nombre_candidato: string;
        cargo_busca: string | null;
        slogan: string | null;
        plan: string;
        veda_activa: boolean;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    getStats(slug: string): Promise<{
        totalVotantes: number;
        totalLideres: number;
        totalEventos: number;
        totalApoyos: number;
        apoyosMes: number;
    }>;
    getLandingData(slug: string): Promise<{
        tenant: {
            slug: string;
            nombre_candidato: string;
            cargo_busca: string;
            slogan: string;
        };
        stats: {
            totalSimpatizantes: number;
            totalEventos: number;
        };
        eventos: {
            id: string;
            nombre: string;
            descripcion: string;
            direccion: string;
            fecha: Date;
            coordenadas: import("@prisma/client/runtime/library").JsonValue;
        }[];
    }>;
    create(data: {
        slug: string;
        nombre_candidato: string;
        cargo_busca?: string;
        slogan?: string;
    }): Promise<{
        id: string;
        slug: string;
        dominio_personalizado: string | null;
        url_completa: string;
        nombre_candidato: string;
        cargo_busca: string | null;
        slogan: string | null;
        plan: string;
        veda_activa: boolean;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    registrarVotantePublico(slug: string, data: {
        nombre: string;
        telefono?: string;
        colonia?: string;
        seccion_electoral?: string;
        nivel_apoyo?: number;
        origen_qr?: string;
    }): Promise<{
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        email: string | null;
        tenant_id: string;
        telefono: string | null;
        nombre: string | null;
        tags: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        seccion_electoral: string | null;
        colonia: string | null;
        telefono_hash: string | null;
        curp: string | null;
        municipio: string | null;
        estado: string | null;
        nivel_apoyo: number | null;
        origen_qr: string | null;
        aviso_privacidad_version: number | null;
        consentimiento_ip: string | null;
        consentimiento_fecha: Date | null;
        ultimo_contacto: Date | null;
        es_lider: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    toggleVeda(id: string, veda_activa: boolean): Promise<{
        id: string;
        slug: string;
        dominio_personalizado: string | null;
        url_completa: string;
        nombre_candidato: string;
        cargo_busca: string | null;
        slogan: string | null;
        plan: string;
        veda_activa: boolean;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
}
