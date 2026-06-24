import { IneService } from './ine.service';
export declare class IneController {
    private readonly ineService;
    constructor(ineService: IneService);
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
