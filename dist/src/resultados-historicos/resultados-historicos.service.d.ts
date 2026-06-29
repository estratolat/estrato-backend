import { PrismaService } from '../common/services/prisma.service';
export declare class ResultadosHistoricosService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, filtros: {
        anio?: number;
        estado_id?: number;
        municipio_id?: number;
        seccion?: string;
        partido?: string;
    }): Promise<({
        tenant: {
            id: string;
            slug: string;
        };
    } & {
        id: number;
        tenant_id: string;
        seccion: string;
        estado_id: number | null;
        municipio_id: number | null;
        votos_ganador: number | null;
        anio: number;
        partido_ganador: string;
        votos_totales: number | null;
        votos_nulos: number | null;
        participacion_pct: number | null;
        desglose_partidos: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    resumen(tenantId: string): Promise<{
        totalRegistros: number;
        aniosDisponibles: number[];
        porAnioPartido: Record<number, Record<string, {
            secciones: number;
            votos: number;
        }>>;
        votosPorAnio: Record<number, number>;
        seccionesPorAnio: Record<number, number>;
    }>;
    importar(tenantId: string, archivo: Express.Multer.File, defaults?: {
        anio?: number;
        estado_id?: number;
        municipio_id?: number;
    }): Promise<{
        totalFilas: number;
        exitosos: number;
        errores: number;
        detallesErrores: {
            fila: number;
            error: string;
        }[];
    }>;
    private parsearCsv;
    private parsearLineaCsv;
    private normalizarFila;
    private normalizarFilaSinaloa;
    private extraerDesglose;
    private formatearSeccion;
    private tieneColumna;
    private extraer;
    private parsearNumero;
    private parsearFloat;
}
