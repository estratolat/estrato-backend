import { PrismaService } from '../common/services/prisma.service';
export declare class VapiService {
    private prisma;
    constructor(prisma: PrismaService);
    getCampanas(): Promise<any>;
    createCampana(data: any): Promise<any>;
    getLlamadas(campanaId: string): Promise<any>;
}
