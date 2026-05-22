import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    setTenant(tenantId: string): Promise<void>;
    setUserRole(role: string, zonasAsignadas?: string[]): Promise<void>;
}
