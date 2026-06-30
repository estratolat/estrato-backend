import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const isServerless = () => process.env.VERCEL || process.env.NODE_ENV === 'production';

// Singleton global para reutilizar el cliente y el pool de conexiones entre invocaciones serverless.
const globalPrisma = global as unknown as { prismaClient?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : undefined,
  });
}

function getPrismaClient(): PrismaClient {
  if (globalPrisma.prismaClient) {
    return globalPrisma.prismaClient;
  }
  const client = createPrismaClient();
  if (isServerless()) {
    globalPrisma.prismaClient = client;
  }
  return client;
}

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async onModuleDestroy() {
    // En serverless mantenemos el cliente vivo para reutilizar conexiones cálidas.
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await this.prisma.$disconnect();
    }
  }

  // Helpers para setear tenant en RLS
  async setTenant(tenantId: string) {
    await this.prisma.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  }

  // Helpers para setear rol de usuario en RLS
  async setUserRole(role: string, zonasAsignadas?: string[]) {
    await this.prisma.$executeRaw`SELECT set_config('app.user_rol', ${role}, true)`;
    if (zonasAsignadas) {
      await this.prisma.$executeRaw`SELECT set_config('app.zonas_asignadas', ${zonasAsignadas.join(',')}, true)`;
    }
  }
}

// Aplicamos un Proxy al prototipo para redirigir cualquier propiedad no definida
// directamente al PrismaClient singleton. Esto mantiene la API existente intacta
// y garantiza que solo exista una instancia real del cliente en serverless.
const prismaProto = PrismaService.prototype as any;
const prismaInstance = getPrismaClient();
Object.setPrototypeOf(
  prismaProto,
  new Proxy(Object.prototype, {
    get: (_target: any, prop: string | symbol) => {
      const value = (prismaInstance as any)[prop];
      if (typeof value === 'function') {
        return value.bind(prismaInstance);
      }
      return value;
    },
  }),
);
