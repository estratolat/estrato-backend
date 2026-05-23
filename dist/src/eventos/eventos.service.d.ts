import { PrismaService } from '../common/services/prisma.service';
export declare class EventosService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    registrarAsistencia(eventoId: string, data: any): Promise<any>;
}
