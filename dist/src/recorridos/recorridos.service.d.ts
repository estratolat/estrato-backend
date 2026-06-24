import { PrismaService } from '../common/services/prisma.service';
export declare class RecorridosService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        secciones: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue;
        fecha: Date;
        usuario_id: string;
        distancia_km: number | null;
        duracion_min: number | null;
    }[]>;
    create(data: any): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        secciones: string[];
        coordenadas: import("@prisma/client/runtime/library").JsonValue;
        fecha: Date;
        usuario_id: string;
        distancia_km: number | null;
        duracion_min: number | null;
    }>;
}
