import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const isServerless = () => process.env.VERCEL || process.env.NODE_ENV === 'production';

let singletonPrisma: PrismaClient | undefined;
const globalPrisma = global as unknown as { prisma?: PrismaClient };

function getSingletonPrisma(): PrismaClient {
  if (singletonPrisma) return singletonPrisma;
  if (globalPrisma.prisma) {
    singletonPrisma = globalPrisma.prisma;
    return singletonPrisma;
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : undefined,
  });

  if (isServerless()) {
    singletonPrisma = client;
    globalPrisma.prisma = client;
  }

  return client;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const singleton = getSingletonPrisma();
    // Reutilizamos la misma instancia global. En serverless solo se crea un PrismaClient real.
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // En serverless, redirigimos todas las propiedades del PrismaClient recién creado
    // hacia el singleton, para evitar mantener dos pools abiertos.
    if (isServerless()) {
      const self = this as any;
      const delegate = singleton as any;
      const props = Object.getOwnPropertyNames(Object.getPrototypeOf(delegate));
      props.forEach((prop) => {
        if (prop === 'constructor' || prop === 'onModuleDestroy') return;
        const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(delegate), prop);
        if (desc && typeof desc.value === 'function') {
          self[prop] = desc.value.bind(delegate);
        }
      });
      // Redirigir modelos (propiedades propias de la instancia)
      Object.keys(delegate).forEach((key) => {
        if (self[key] !== undefined) return;
        self[key] = delegate[key];
      });
    }
  }

  async onModuleDestroy() {
    // En serverless no desconectamos para mantener el pool cálido entre invocaciones.
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await this.$disconnect();
    }
  }

  // Helpers para setear tenant en RLS
  async setTenant(tenantId: string) {
    const client = isServerless() ? getSingletonPrisma() : this;
    await client.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  }

  // Helpers para setear rol de usuario en RLS
  async setUserRole(role: string, zonasAsignadas?: string[]) {
    const client = isServerless() ? getSingletonPrisma() : this;
    await client.$executeRaw`SELECT set_config('app.user_rol', ${role}, true)`;
    if (zonasAsignadas) {
      await client.$executeRaw`SELECT set_config('app.zonas_asignadas', ${zonasAsignadas.join(',')}, true)`;
    }
  }
}
