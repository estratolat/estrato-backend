import { PrismaService } from '../common/services/prisma.service';
export declare class ApoyosService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any): Promise<any>;
    create(data: any): Promise<any>;
}
