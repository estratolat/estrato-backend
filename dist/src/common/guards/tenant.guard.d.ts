import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
export declare class TenantGuard implements CanActivate {
    private prisma;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
