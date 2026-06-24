import { PrismaService } from '../common/services/prisma.service';
export declare class IneService {
    private prisma;
    constructor(prisma: PrismaService);
    getBitacora(): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        tipo: string;
        descripcion: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        usuario_id: string;
        monto: import("@prisma/client/runtime/library").Decimal | null;
        evidencia_url: string | null;
    }[]>;
    registrar(data: any): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        tipo: string;
        descripcion: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        usuario_id: string;
        monto: import("@prisma/client/runtime/library").Decimal | null;
        evidencia_url: string | null;
    }>;
}
