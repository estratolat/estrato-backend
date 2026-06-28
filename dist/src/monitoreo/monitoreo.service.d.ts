import { PrismaService } from '../common/services/prisma.service';
export declare class MonitoreoService {
    private prisma;
    constructor(prisma: PrismaService);
    resumen(tenantId: string): Promise<{
        total_casillas: number;
        sin_reportar: number;
        abiertas: number;
        cerradas: number;
        incidencias: number;
        votantes_esperados: number;
        cobertura_pct: number;
    }>;
    porSeccion(tenantId: string): Promise<{
        seccion: string;
        total: number;
        abiertas: number;
        cerradas: number;
        incidencias: number;
        sin_reportar: number;
        esperados: number;
    }[]>;
    casillas(query: any, tenantId: string): Promise<({
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
        incidencia: string | null;
        referencia: string | null;
        ubicacion: string | null;
        numero: string | null;
        mesa_directiva: string | null;
        horario_apertura: Date | null;
        horario_cierre: Date | null;
        electores_esperados: number | null;
        responsable_id: string | null;
        notas: string | null;
    })[]>;
    incidencias(tenantId: string): Promise<({
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
        incidencia: string | null;
        referencia: string | null;
        ubicacion: string | null;
        numero: string | null;
        mesa_directiva: string | null;
        horario_apertura: Date | null;
        horario_cierre: Date | null;
        electores_esperados: number | null;
        responsable_id: string | null;
        notas: string | null;
    })[]>;
}
