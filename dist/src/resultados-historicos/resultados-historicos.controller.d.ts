import { ResultadosHistoricosService } from './resultados-historicos.service';
import { FiltrosResultadosDto } from './dto/filtros-resultados.dto';
import { ImportarResultadosDto } from './dto/importar-resultados.dto';
export declare class ResultadosHistoricosController {
    private readonly service;
    constructor(service: ResultadosHistoricosService);
    findAll(query: FiltrosResultadosDto, req: any): Promise<({
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
    resumen(req: any): Promise<{
        totalRegistros: number;
        aniosDisponibles: number[];
        porAnioPartido: Record<number, Record<string, {
            secciones: number;
            votos: number;
        }>>;
        votosPorAnio: Record<number, number>;
        seccionesPorAnio: Record<number, number>;
    }>;
    importar(archivo: Express.Multer.File, body: ImportarResultadosDto, req: any): Promise<{
        totalFilas: number;
        exitosos: number;
        errores: number;
        detallesErrores: {
            fila: number;
            error: string;
        }[];
    }>;
}
