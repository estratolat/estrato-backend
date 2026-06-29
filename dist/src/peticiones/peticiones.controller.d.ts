import { PeticionesService } from './peticiones.service';
export declare class PeticionesController {
    private readonly peticionesService;
    constructor(peticionesService: PeticionesService);
    findAll(query: any, req: any): Promise<({
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
        prioridad: import(".prisma/client").$Enums.PrioridadPeticion;
        categoria: import(".prisma/client").$Enums.CategoriaPeticion;
        estatus: import(".prisma/client").$Enums.EstatusPeticion;
    })[]>;
    create(data: any, req: any): Promise<{
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
        prioridad: import(".prisma/client").$Enums.PrioridadPeticion;
        categoria: import(".prisma/client").$Enums.CategoriaPeticion;
        estatus: import(".prisma/client").$Enums.EstatusPeticion;
    }>;
    updateEstatus(id: string, estatus: string, req: any): Promise<{
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
        prioridad: import(".prisma/client").$Enums.PrioridadPeticion;
        categoria: import(".prisma/client").$Enums.CategoriaPeticion;
        estatus: import(".prisma/client").$Enums.EstatusPeticion;
    }>;
}
