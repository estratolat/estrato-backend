import { PrismaService } from '../common/services/prisma.service';
export declare class BoletinesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    create(data: any): Promise<any>;
    aprobar(id: string): Promise<any>;
    rechazar(id: string): Promise<any>;
}
