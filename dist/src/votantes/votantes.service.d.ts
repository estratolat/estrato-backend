import { PrismaService } from '../common/services/prisma.service';
export declare class VotantesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any): Promise<any>;
    findOne(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
}
