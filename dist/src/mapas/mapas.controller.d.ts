import { MapasService } from './mapas.service';
import { GisParserService } from './gis-parser.service';
import { ImportarSeccionesIneDto } from './dto/importar-secciones-ine.dto';
import { ImportarSeccionesExcelDto } from './dto/importar-secciones-excel.dto';
import { BuscarGlobalDto } from './dto/buscar-global.dto';
import { DetalleTerritorialDto } from './dto/detalle-territorial.dto';
export declare class MapasController {
    private readonly mapasService;
    private readonly gisParser;
    constructor(mapasService: MapasService, gisParser: GisParserService);
    findAllCapas(req: any): Promise<{
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
    findOneCapa(id: string, req: any): Promise<{
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
    createCapa(data: any, req: any): Promise<{
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
    updateCapa(id: string, data: any, req: any): Promise<{
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
    removeCapa(id: string, req: any): Promise<{
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
    geojson(query: any, req: any): Promise<Record<string, any>>;
    findAllSeccionesINE(estadoId: string, municipioId: string, req: any): Promise<{
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
    importarSeccionesINE(archivo: Express.Multer.File, body: ImportarSeccionesIneDto, req: any): Promise<{
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
    importarSeccionesExcel(archivo: Express.Multer.File, body: ImportarSeccionesExcelDto, req: any): Promise<{
        total_filas: number;
        importadas: number;
        actualizadas: number;
        nuevas: number;
        historicos: number;
        omitidas: number;
    }>;
    buscarGlobal(dto: BuscarGlobalDto, req: any): Promise<{
        resultados: any[];
    }>;
    detalleTerritorial(dto: DetalleTerritorialDto, req: any): Promise<{
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
    seedDemo(req: any): Promise<{
        creadas: number;
        message: string;
        total: number;
    }>;
    subirArchivo(archivo: Express.Multer.File, body: any, req: any): Promise<{
        message: string;
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
        features_count: any;
    }>;
    estadisticas(nivel: string, req: any): Promise<{
        nivel: string;
        total_items: number;
        items: any[];
    }>;
}
