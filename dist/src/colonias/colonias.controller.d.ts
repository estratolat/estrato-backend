import { Request } from 'express';
import { ColoniasService, ResultadoColonia } from './colonias.service';
import { MapasService } from '../mapas/mapas.service';
interface RequestConTenant extends Request {
    tenant: {
        id: string;
    };
    usuario: {
        id: string;
    };
}
declare class BuscarColoniaDto {
    q: string;
    estado?: string;
    municipio?: string;
}
declare class ImportarColoniaDto {
    id: string;
    nombre: string;
    estado?: string;
    municipio?: string;
    codigo_postal?: string;
    color?: string;
}
export declare class ColoniasController {
    private readonly coloniasService;
    private readonly mapasService;
    private readonly logger;
    constructor(coloniasService: ColoniasService, mapasService: MapasService);
    buscar(dto: BuscarColoniaDto): Promise<ResultadoColonia[]>;
    importar(dto: ImportarColoniaDto, req: RequestConTenant): Promise<{
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
    }>;
}
export {};
