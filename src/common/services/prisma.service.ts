import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { __estratoPrisma?: PrismaClient };

function maskUrl(url?: string): string | undefined {
  return url?.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@');
}

function setSearchParam(url: string, key: string, value: string): string {
  const base = url.split('?')[0];
  const params = new URLSearchParams(url.split('?')[1] || '');
  params.set(key, value);
  return `${base}?${params.toString()}`;
}

function removeSearchParam(url: string, key: string): string {
  const base = url.split('?')[0];
  const params = new URLSearchParams(url.split('?')[1] || '');
  params.delete(key);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function sanitizeDbUrl(url?: string): string | undefined {
  if (!url) return url;

  // Supabase Pooler: usar Transaction Pooler 6543 + pgbouncer=true.
  if (url.includes('pooler.supabase.com:5432')) {
    url = url.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');
  }
  url = setSearchParam(url, 'pgbouncer', 'true');

  // En serverless mantenemos un único PrismaClient y conexiones mínimas.
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  url = setSearchParam(url, 'connection_limit', isServerless ? '1' : '5');

  // Un pool_timeout corto evita esperar 30s y deja ver el error real rápido.
  url = setSearchParam(url, 'pool_timeout', isServerless ? '10' : '20');

  return url;
}

function getPrismaClientConfig() {
  const rawUrl = process.env.DATABASE_URL;
  const dbUrl = sanitizeDbUrl(rawUrl);

  if (dbUrl !== rawUrl) {
    console.log('[PrismaService] DATABASE_URL ajustada para PgBouncer/serverless:', maskUrl(dbUrl));
  }

  const logLevels: Array<'query' | 'info' | 'warn' | 'error'> = process.env.VERCEL
    ? ['warn', 'error']
    : ['query', 'info', 'warn', 'error'];

  return {
    datasources: { db: { url: dbUrl } },
    log: logLevels,
  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Singleton global para serverless: evita crear múltiples PrismaClient por invocación.
    if (globalForPrisma.__estratoPrisma) {
      const existing = globalForPrisma.__estratoPrisma;
      // @ts-expect-error: en JS un constructor puede retornar una instancia existente.
      return existing;
    }

    super(getPrismaClientConfig());
    globalForPrisma.__estratoPrisma = this;
  }

  async onModuleDestroy() {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await this.$disconnect();
    }
  }

  async setTenant(tenantId: string) {
    await this.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
  }

  async setUserRole(role: string, zonasAsignadas?: string[]) {
    await this.$executeRaw`SELECT set_config('app.user_rol', ${role}, true)`;
    if (zonasAsignadas) {
      await this.$executeRaw`SELECT set_config('app.zonas_asignadas', ${zonasAsignadas.join(',')}, true)`;
    }
  }
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.__estratoPrisma) {
    globalForPrisma.__estratoPrisma = new PrismaClient(getPrismaClientConfig());
  }
  return globalForPrisma.__estratoPrisma;
}
