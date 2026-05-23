import { PrismaService } from '../common/services/prisma.service';
export declare class IneService {
    private prisma;
    constructor(prisma: PrismaService);
    getBitacora(): Promise<any>;
    registrar(data: any): Promise<any>;
}
