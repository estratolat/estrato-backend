import { FichasSeccionalesService } from './fichas-seccionales.service';
export declare class FichasSeccionalesController {
    private readonly fichasService;
    constructor(fichasService: FichasSeccionalesService);
    secciones(req: any): Promise<string[]>;
    ficha(seccion: string, req: any): Promise<{
        seccion: string;
        votantes: number;
        lideres: number;
        apoyos: number;
        eventos: number;
        mensajes: number;
        casillas: ({
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
        })[];
        metas: ({
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
        })[];
        resultados: {
            anio: number;
            partido_ganador: string;
            votos_ganador: number;
            votos_totales: number;
            participacion_pct: number;
        }[];
        lista_nominal_2024: number;
        proyeccion: {
            seccion: string;
            votantes: number;
            apoyos: number;
            lideres: number;
            lista_nominal_2024: number;
            meta_votos: number;
            votos_estimados: number;
            faltan_para_ganar: number;
            tendencia: string;
        };
    }>;
    comparativa(secciones: string[], req: any): Promise<{
        seccion: string;
        votantes: number;
        lideres: number;
        apoyos: number;
        eventos: number;
        mensajes: number;
        casillas: ({
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
        })[];
        metas: ({
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
        })[];
        resultados: {
            anio: number;
            partido_ganador: string;
            votos_ganador: number;
            votos_totales: number;
            participacion_pct: number;
        }[];
        lista_nominal_2024: number;
        proyeccion: {
            seccion: string;
            votantes: number;
            apoyos: number;
            lideres: number;
            lista_nominal_2024: number;
            meta_votos: number;
            votos_estimados: number;
            faltan_para_ganar: number;
            tendencia: string;
        };
    }[]>;
}
