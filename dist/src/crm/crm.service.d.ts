import { PrismaService } from '../common/services/prisma.service';
export declare class CrmService {
    private prisma;
    constructor(prisma: PrismaService);
    getMensajes(filters: any): Promise<any>;
    enviarMensaje(data: any): Promise<any>;
    getStats(): Promise<{
        total: any;
        pendientes: any;
    }>;
}
