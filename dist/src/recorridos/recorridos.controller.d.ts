import { RecorridosService } from './recorridos.service';
export declare class RecorridosController {
    private readonly recorridosService;
    constructor(recorridosService: RecorridosService);
    findAll(): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        secciones: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue;
        fecha: Date;
        usuario_id: string;
        distancia_km: number | null;
        duracion_min: number | null;
    }[]>;
    create(data: any): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        secciones: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue;
        fecha: Date;
        usuario_id: string;
        distancia_km: number | null;
        duracion_min: number | null;
    }>;
}
