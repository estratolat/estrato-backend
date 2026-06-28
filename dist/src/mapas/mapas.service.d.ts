import { PrismaService } from '../common/services/prisma.service';
import { InegiService } from '../inegi/inegi.service';
import { NominatimService } from '../inegi/nominatim.service';
export declare class MapasService {
    private prisma;
    private inegiService?;
    private nominatimService?;
    constructor(prisma: PrismaService, inegiService?: InegiService, nominatimService?: NominatimService);
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
            geojson: import("@prisma/client/runtime/library").JsonValue | null;
            origen: import(".prisma/client").$Enums.CapaMapaOrigen;
            visible: boolean;
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
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
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
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
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
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
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
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
    }>;
    findAllSeccionesINE(tenantId: string, estadoId?: number, municipioId?: number): Promise<{
        id: string;
        tenant_id: string;
        nombre: string | null;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        color: string | null;
        municipio: string;
        estado: string;
        observaciones: string | null;
        seccion: string;
        estado_id: number;
        municipio_id: number;
        distrito_federal: number | null;
        distrito_local: number | null;
        padron_2024: number | null;
        lista_nominal_2024: number | null;
        casillas_total: number | null;
        meta: string | null;
    }[]>;
    importarSeccionesINE(tenantId: string, userId: string | undefined, geojson: any, metadata: {
        nombre: string;
        color: string;
        estado_id: number;
        estado: string;
        municipio_id?: number;
        municipio?: string;
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
            geojson: import("@prisma/client/runtime/library").JsonValue | null;
            origen: import(".prisma/client").$Enums.CapaMapaOrigen;
            visible: boolean;
        };
        total_secciones: number;
    }>;
    importarSeccionesExcel(tenantId: string, buffer: Buffer, opts: {
        estado_id?: number;
        estado?: string;
    }): Promise<{
        total_filas: number;
        importadas: number;
        actualizadas: number;
        nuevas: number;
        historicos: number;
        omitidas: number;
    }>;
    private leerExcel;
    private normalizarKeys;
    private normalizarTexto;
    private normalizarFilaExcel;
    private esColorValido;
    private parsearFloat;
    private bulkUpdateSeccionesINE;
    private bulkInsertSeccionesINE;
    private bulkUpsertResultadosHistoricos;
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
    buscarGlobal(tenantId: string, query: string, limit?: number, tipoFiltro?: string): Promise<{
        resultados: any[];
    }>;
    private filtrarInegiGlobal;
    detalleTerritorial(tenantId: string, dto: {
        tipo: string;
        id: string;
        nombre: string;
        geometry: any;
        estado_id?: number;
        municipio_id?: number;
        seccion?: string;
        clave?: string;
    }): Promise<{
        tipo: string;
        id: string;
        nombre: string;
        geometry: any;
        bbox: [number, number, number, number];
        datos_oficiales: any;
        resumen: {
            votantes: {
                count: number;
                items: any[];
            };
            lideres: {
                count: number;
                items: any[];
            };
            apoyos: {
                count: number;
                items: any[];
            };
            eventos: {
                count: number;
                items: any[];
            };
            peticiones: {
                count: number;
                items: any[];
            };
        };
    }>;
    private contarYListarVotantes;
    private contarYListarLideres;
    private contarYListarApoyos;
    private contarEventos;
    private contarPeticiones;
    private candidatosEnBBox;
    private puntoEnPoligono;
    private bboxFromGeometry;
}
