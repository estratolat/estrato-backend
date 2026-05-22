import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper para setear tenant en RLS
  async setTenant(tenantId: string) {
    await this.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  }

  // Helper para setear rol de usuario en RLS
  async setUserRole(role: string, zonasAsignadas?: string[]) {
    await this.$executeRaw`SELECT set_config('app.user_rol', ${role}, true)`;
    if (zonasAsignadas) {
      await this.$executeRaw`SELECT set_config('app.zonas_asignadas', ${zonasAsignadas.join(',')}, true)`;
    }
  }
}
