import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const isServerless = () => process.env.VERCEL || process.env.NODE_ENV === 'production';

let singletonPrisma: PrismaClient | undefined;

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

function getSingletonPrisma(): PrismaClient {
  if (singletonPrisma) return singletonPrisma;

  const client = createPrismaClient();

  // Añadimos helpers usados por la app directamente sobre el singleton,
  // así todos los PrismaService inyectados delegan a la misma instancia.
  const prismaWithHelpers = client as PrismaClient & {
    setTenant: (tenantId: string) => Promise<void>;
    setUserRole: (role: string, zonasAsignadas?: string[]) => Promise<void>;
  };

  prismaWithHelpers.setTenant = async (tenantId: string) => {
    await client.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  };

  prismaWithHelpers.setUserRole = async (role: string, zonasAsignadas?: string[]) => {
    await client.$executeRaw`SELECT set_config('app.user_rol', ${role}, true)`;
    if (zonasAsignadas) {
      await client.$executeRaw`SELECT set_config('app.zonas_asignadas', ${zonasAsignadas.join(',')}, true)`;
    }
  };

  if (isServerless()) {
    singletonPrisma = client;
  }

  return client;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly delegate: PrismaClient;

  constructor() {
    const delegate = getSingletonPrisma();
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    this.delegate = delegate;

    // En serverless reemplazamos la instancia creada por `super()` con el singleton,
    // evitando que cada provider inyectado abra conexiones propias.
    if (isServerless() && delegate !== this) {
      return new Proxy(this, {
        get: (target: any, prop: string | symbol) => {
          if (prop in target) {
            return target[prop];
          }
          const value = (delegate as any)[prop];
          return typeof value === 'function' ? value.bind(delegate) : value;
        },
      }) as any;
    }
  }

  async onModuleDestroy() {
    // En serverless no desconectamos para mantener el pool cálido entre invocaciones.
    // Solo desconectamos en desarrollo/test.
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await this.$disconnect();
    }
  }

  // Helpers para RLS (también expuestos en el singleton)
  async setTenant(tenantId: string) {
    await this.delegate.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  }

  async setUserRole(role: string, zonasAsignadas?: string[]) {
    await this.delegate.$executeRaw`SELECT set_config('app.user_rol', ${role}, true)`;
    if (zonasAsignadas) {
      await this.delegate.$executeRaw`SELECT set_config('app.zonas_asignadas', ${zonasAsignadas.join(',')}, true)`;
    }
  }
}
