import { PrismaService } from '../common/services/prisma.service';
export declare class ApoyosService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any, tenantId: string): Promise<({
        votante: {
            id: string;
            nombre: string;
            seccion_electoral: string;
        };
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        votante_id: string;
        tipo_apoyo: string;
        cantidad: number;
        foto_url: string | null;
        foto_hash_md5: string | null;
        entregado_por: string;
        observaciones: string | null;
        verificado: boolean;
        fecha_entrega: Date;
    })[]>;
    create(data: any, tenantId: string, userId?: string): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        votante_id: string;
        tipo_apoyo: string;
        cantidad: number;
        foto_url: string | null;
        foto_hash_md5: string | null;
        entregado_por: string;
        observaciones: string | null;
        verificado: boolean;
        fecha_entrega: Date;
    }>;
}
