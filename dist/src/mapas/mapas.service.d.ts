import { PrismaService } from '../common/services/prisma.service';
export declare class MapasService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllCapas(tenantId: string): Promise<{
        predefinidas: {
            id: string;
            tipo: string;
            nombre: string;
            origen: string;
            color: string;
            visible: boolean;
            orden: number;
        }[];
        personalizadas: ({
            creador: {
                id: string;
                nombre: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            tenant_id: string;
            nombre: string;
            color: string;
            tipo: import(".prisma/client").$Enums.CapaMapaTipo;
            orden: number;
            created_by: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            origen: import(".prisma/client").$Enums.CapaMapaOrigen;
            visible: boolean;
            geojson: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    }>;
    findOneCapa(id: string, tenantId: string): Promise<{
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        nombre: string;
        color: string;
        tipo: import(".prisma/client").$Enums.CapaMapaTipo;
        orden: number;
        created_by: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    createCapa(data: any, tenantId: string, userId?: string): Promise<{
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        nombre: string;
        color: string;
        tipo: import(".prisma/client").$Enums.CapaMapaTipo;
        orden: number;
        created_by: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateCapa(id: string, data: any, tenantId: string): Promise<{
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        nombre: string;
        color: string;
        tipo: import(".prisma/client").$Enums.CapaMapaTipo;
        orden: number;
        created_by: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    removeCapa(id: string, tenantId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        nombre: string;
        color: string;
        tipo: import(".prisma/client").$Enums.CapaMapaTipo;
        orden: number;
        created_by: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAllSeccionesINE(tenantId: string, estadoId?: number, municipioId?: number): Promise<{
        id: string;
        tenant_id: string;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        municipio: string;
        estado: string;
        seccion: string;
        estado_id: number;
        municipio_id: number;
        distrito_federal: number | null;
        distrito_local: number | null;
        padron_2024: number | null;
        lista_nominal_2024: number | null;
    }[]>;
    importarSeccionesINE(tenantId: string, userId: string | undefined, geojson: any, metadata: {
        nombre: string;
        color: string;
        estado_id: number;
        estado: string;
        municipio_id: number;
        municipio: string;
        anio?: number;
    }): Promise<{
        capa: {
            creador: {
                id: string;
                nombre: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            tenant_id: string;
            nombre: string;
            color: string;
            tipo: import(".prisma/client").$Enums.CapaMapaTipo;
            orden: number;
            created_by: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            origen: import(".prisma/client").$Enums.CapaMapaOrigen;
            visible: boolean;
            geojson: import("@prisma/client/runtime/library").JsonValue | null;
        };
        total_secciones: number;
    }>;
    private extraerCampo;
    private normalizarAMultiPolygon;
    private normalizarCapa;
    private validarGeoJson;
    private parsearEntero;
    private puntoDesde;
    geojson(tenantId: string, capasSolicitadas: string[], query: any): Promise<Record<string, any>>;
    private geojsonZonas;
    private geojsonSeccionesINE;
    private formatearSecciones;
    private geojsonLideres;
    private geojsonVotantes;
    private geojsonApoyos;
    private geojsonPeticiones;
    private geojsonEventos;
    private geojsonRecorridos;
    private geojsonCapaPersonalizada;
    estadisticas(tenantId: string, nivel?: 'seccion' | 'zona'): Promise<{
        nivel: string;
        total_items: number;
        items: any[];
    }>;
    private estadisticasPorSeccion;
    private estadisticasPorZonaConDetalle;
    estadisticasPorZona(tenantId: string, zonas?: any[]): Promise<any[]>;
    seedDemo(tenantId: string): Promise<{
        creadas: number;
        message: string;
        total: number;
    }>;
}
