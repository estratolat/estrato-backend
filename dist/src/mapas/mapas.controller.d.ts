import { MapasService } from './mapas.service';
import { GisParserService } from './gis-parser.service';
import { ImportarSeccionesIneDto } from './dto/importar-secciones-ine.dto';
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
            origen: import(".prisma/client").$Enums.CapaMapaOrigen;
            visible: boolean;
            geojson: import("@prisma/client/runtime/library").JsonValue | null;
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
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
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
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
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
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
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
        origen: import(".prisma/client").$Enums.CapaMapaOrigen;
        visible: boolean;
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    geojson(query: any, req: any): Promise<Record<string, any>>;
    findAllSeccionesINE(estadoId: string, municipioId: string, req: any): Promise<{
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
            origen: import(".prisma/client").$Enums.CapaMapaOrigen;
            visible: boolean;
            geojson: import("@prisma/client/runtime/library").JsonValue | null;
        };
        total_secciones: number;
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
            origen: import(".prisma/client").$Enums.CapaMapaOrigen;
            visible: boolean;
            geojson: import("@prisma/client/runtime/library").JsonValue | null;
        };
        features_count: any;
    }>;
    estadisticas(nivel: string, req: any): Promise<{
        nivel: string;
        total_items: number;
        items: any[];
    }>;
}
