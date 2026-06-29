import { CasillasService } from './casillas.service';
export declare class CasillasController {
    private readonly casillasService;
    constructor(casillasService: CasillasService);
    findAll(query: any, req: any): Promise<({
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
    findOne(id: string, req: any): Promise<{
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
    }>;
    create(data: any, req: any): Promise<{
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
    }>;
    update(id: string, data: any, req: any): Promise<{
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
    }>;
    updateStatus(id: string, status: string, incidencia: string, req: any): Promise<{
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
    }>;
    remove(id: string, req: any): Promise<{
        ok: boolean;
    }>;
    importar(body: {
        casillas: any[];
    }, req: any): Promise<{
        creadas: number;
    }>;
}
