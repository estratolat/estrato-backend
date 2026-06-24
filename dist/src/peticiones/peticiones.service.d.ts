import { PrismaService } from '../common/services/prisma.service';
export declare class PeticionesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any, tenantId: string): Promise<({
        votante: {
            id: string;
            telefono: string;
            nombre: string;
        };
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string | null;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        descripcion: string;
        created_by: string;
        votante_id: string | null;
        foto_url: string | null;
        categoria: import(".prisma/client").$Enums.CategoriaPeticion;
        prioridad: import(".prisma/client").$Enums.PrioridadPeticion;
        estatus: import(".prisma/client").$Enums.EstatusPeticion;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        votante: {
            id: string;
            telefono: string;
            nombre: string;
        };
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string | null;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        descripcion: string;
        created_by: string;
        votante_id: string | null;
        foto_url: string | null;
        categoria: import(".prisma/client").$Enums.CategoriaPeticion;
        prioridad: import(".prisma/client").$Enums.PrioridadPeticion;
        estatus: import(".prisma/client").$Enums.EstatusPeticion;
    }>;
    create(data: any, tenantId: string, userId: string): Promise<{
        votante: {
            id: string;
            nombre: string;
        };
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string | null;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        descripcion: string;
        created_by: string;
        votante_id: string | null;
        foto_url: string | null;
        categoria: import(".prisma/client").$Enums.CategoriaPeticion;
        prioridad: import(".prisma/client").$Enums.PrioridadPeticion;
        estatus: import(".prisma/client").$Enums.EstatusPeticion;
    }>;
    updateEstatus(id: string, estatus: string, tenantId: string): Promise<{
        votante: {
            id: string;
            nombre: string;
        };
        creador: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        tenant_id: string;
        titulo: string | null;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        descripcion: string;
        created_by: string;
        votante_id: string | null;
        foto_url: string | null;
        categoria: import(".prisma/client").$Enums.CategoriaPeticion;
        prioridad: import(".prisma/client").$Enums.PrioridadPeticion;
        estatus: import(".prisma/client").$Enums.EstatusPeticion;
    }>;
}
