import { ProyeccionService } from './proyeccion.service';
export declare class ProyeccionController {
    private readonly proyeccionService;
    constructor(proyeccionService: ProyeccionService);
    resumen(req: any): Promise<{
        votantes_registrados: number;
        votantes_capturados: number;
        apoyos_registrados: number;
        lideres_registrados: number;
        meta_votos_total: number;
        meta_participacion: number;
        meta_lista_nominal: number;
        brecha: number;
        avance_padron: number;
    }>;
    secciones(req: any): Promise<any[]>;
    findMetas(query: any, req: any): Promise<({
        zona: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        zona_id: string | null;
        meta_votos: number;
        seccion: string | null;
        proceso: string;
        meta_lista_nominal: number | null;
        meta_participacion: number | null;
    })[]>;
    createMeta(data: any, req: any): Promise<{
        zona: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        zona_id: string | null;
        meta_votos: number;
        seccion: string | null;
        proceso: string;
        meta_lista_nominal: number | null;
        meta_participacion: number | null;
    }>;
    updateMeta(id: string, data: any, req: any): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        zona_id: string | null;
        meta_votos: number;
        seccion: string | null;
        proceso: string;
        meta_lista_nominal: number | null;
        meta_participacion: number | null;
    }>;
    removeMeta(id: string, req: any): Promise<{
        ok: boolean;
    }>;
}
