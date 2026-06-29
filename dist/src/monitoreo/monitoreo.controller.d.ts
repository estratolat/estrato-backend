import { MonitoreoService } from './monitoreo.service';
export declare class MonitoreoController {
    private readonly monitoreoService;
    constructor(monitoreoService: MonitoreoService);
    resumen(req: any): Promise<{
        total_casillas: number;
        sin_reportar: number;
        abiertas: number;
        cerradas: number;
        incidencias: number;
        votantes_esperados: number;
        cobertura_pct: number;
    }>;
    porSeccion(req: any): Promise<{
        seccion: string;
        total: number;
        abiertas: number;
        cerradas: number;
        incidencias: number;
        sin_reportar: number;
        esperados: number;
    }[]>;
    casillas(query: any, req: any): Promise<({
        responsable: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: import(".prisma/client").$Enums.TipoCasilla;
        direccion: string | null;
        status: string;
        seccion: string;
        notas: string | null;
        numero: string | null;
        ubicacion: string | null;
        referencia: string | null;
        mesa_directiva: string | null;
        horario_apertura: Date | null;
        horario_cierre: Date | null;
        electores_esperados: number | null;
        incidencia: string | null;
        responsable_id: string | null;
    })[]>;
    incidencias(req: any): Promise<({
        responsable: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: import(".prisma/client").$Enums.TipoCasilla;
        direccion: string | null;
        status: string;
        seccion: string;
        notas: string | null;
        numero: string | null;
        ubicacion: string | null;
        referencia: string | null;
        mesa_directiva: string | null;
        horario_apertura: Date | null;
        horario_cierre: Date | null;
        electores_esperados: number | null;
        incidencia: string | null;
        responsable_id: string | null;
    })[]>;
}
