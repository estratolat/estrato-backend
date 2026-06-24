import { PrismaService } from '../common/services/prisma.service';
export declare class LideresService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, filtros?: {
        padres?: boolean;
        scoreMin?: number;
        zonaId?: string;
        sinCoordenadas?: boolean;
        limit?: number;
    }): Promise<{
        lideres_hijos_count: number;
        zonas: {
            id: string;
            nombre: string;
            secciones: string[];
            color: string;
        }[];
        votante: {
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
        };
        _count: {
            lideresHijos: number;
        };
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        votante_id: string;
        lider_padre_id: string | null;
        alcance_estimado: number | null;
        score: number;
    }[]>;
    findOne(id: string, tenantId: string): Promise<{
        metricas: {
            votantes_bajo_red: number;
            lideres_hijos_count: number;
            eventos_count: number;
            recorridos_count: number;
            apoyos_count: number;
            alcance_estimado: number;
            score: number;
        };
        actividad: {
            recorridos: {
                id: string;
                usuario_id: string;
                usuario_nombre: string;
                fecha: Date;
                distancia_km: number;
                duracion_min: number;
                secciones: string[];
            }[];
            apoyos: {
                id: string;
                tipo_apoyo: string;
                fecha_entrega: Date;
                foto_url: string;
                votante_nombre: string;
                seccion_electoral: string;
                coordenadas: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
        zonas: {
            id: string;
            nombre: string;
            secciones: string[];
            coordenadas: import("@prisma/client/runtime/library").JsonValue;
            color: string;
        }[];
        votante: {
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
        };
        _count: {
            lideresHijos: number;
        };
        liderPadre: {
            votante: {
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
        lideresHijos: ({
            votante: {
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
        })[];
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        votante_id: string;
        lider_padre_id: string | null;
        alcance_estimado: number | null;
        score: number;
    }>;
    create(data: any, tenantId?: string): Promise<{
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        votante_id: string;
        lider_padre_id: string | null;
        alcance_estimado: number | null;
        score: number;
    }>;
    update(id: string, data: any): Promise<{
        zonas: {
            id: string;
            nombre: string;
            secciones: string[];
            color: string;
        }[];
        votante: {
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
        };
        liderPadre: {
            votante: {
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
        lideresHijos: ({
            votante: {
                nombre: string;
                coordenadas: import("@prisma/client/runtime/library").JsonValue;
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
        })[];
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
    }>;
    delete(id: string): Promise<{
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        votante_id: string;
        lider_padre_id: string | null;
        alcance_estimado: number | null;
        score: number;
    }>;
    updateScore(id: string, score: number): Promise<{
        id: string;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        votante_id: string;
        lider_padre_id: string | null;
        alcance_estimado: number | null;
        score: number;
    }>;
    geojsonInfluencia(tenantId: string, radioMetros: number): Promise<{
        type: string;
        radio_metros: number;
        features: {
            type: string;
            geometry: {
                type: string;
                coordinates: [number, number];
            };
            properties: {
                id: string;
                nombre: string;
                telefono: string;
                seccion_electoral: string;
                colonia: string;
                alcance_estimado: number;
                score: number;
                votante_id: string;
                radio_metros: number;
                zonas: {
                    id: string;
                    nombre: string;
                    secciones: string[];
                    color: string;
                }[];
            };
        }[];
    }>;
    getStats(tenantId: string): Promise<{
        total: number;
        con_coordenadas: number;
        sin_zona: number;
        cobertura_pct: number;
    }>;
}
