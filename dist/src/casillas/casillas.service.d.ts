import { PrismaService } from '../common/services/prisma.service';
export declare class CasillasService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any, tenantId: string): Promise<({
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
    findOne(id: string, tenantId: string): Promise<{
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
    }>;
    buildPayload(data: any): any;
    create(data: any, tenantId: string): Promise<{
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
    }>;
    update(id: string, data: any, tenantId: string): Promise<{
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
    }>;
    updateStatus(id: string, status: string, incidencia: string | undefined, tenantId: string): Promise<{
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
    }>;
    remove(id: string, tenantId: string): Promise<{
        ok: boolean;
    }>;
    importar(data: any[], tenantId: string): Promise<{
        creadas: number;
    }>;
}
