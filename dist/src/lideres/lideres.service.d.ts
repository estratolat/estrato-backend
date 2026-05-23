import { PrismaService } from '../common/services/prisma.service';
export declare class LideresService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(data: any): Promise<any>;
    updateScore(id: string, score: number): Promise<any>;
}
