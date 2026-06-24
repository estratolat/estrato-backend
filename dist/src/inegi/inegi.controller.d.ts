import { Request, Response } from 'express';
import { InegiService, TipoCapaInegi } from './inegi.service';
import { InegiWmsService, CapaInegiWms } from './inegi-wms.service';
import { MapasService } from '../mapas/mapas.service';
interface RequestConTenant extends Request {
    tenant: {
        id: string;
    };
    usuario: {
        id: string;
    };
}
declare class DescargarDto {
    tipo: TipoCapaInegi;
    clave?: string;
    nombre?: string;
    color?: string;
}
export declare class InegiController {
    private readonly inegiService;
    private readonly inegiWmsService;
    private readonly mapasService;
    private readonly logger;
    constructor(inegiService: InegiService, inegiWmsService: InegiWmsService, mapasService: MapasService);
    proxyWms(res: Response, capa: CapaInegiWms, bbox: string, width: string, height: string, srs?: string, version?: string, format?: string, styles?: string, cve?: string, transparent?: string): Promise<void>;
    descargar(tipo: TipoCapaInegi, clave?: string): Promise<any>;
    importar(dto: DescargarDto, req: RequestConTenant): Promise<{
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
        features: any;
    }>;
}
export {};
