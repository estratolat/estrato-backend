import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/services/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            nombre: any;
            rol: any;
            tenant_id: any;
            tenant_slug: any;
        };
    }>;
    getMe(userId: string): Promise<any>;
}
