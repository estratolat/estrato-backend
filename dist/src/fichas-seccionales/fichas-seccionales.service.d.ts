import { PrismaService } from '../common/services/prisma.service';
export declare class FichasSeccionalesService {
    private prisma;
    constructor(prisma: PrismaService);
    secciones(tenantId: string): Promise<string[]>;
    ficha(seccion: string, tenantId: string): Promise<{
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
    comparativa(secciones: string[], tenantId: string): Promise<{
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
