import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { __estratoPrisma?: PrismaClient };

function sanitizeDbUrl(url?: string): string | undefined {
  if (!url) return url;
  // Supabase Pooler: para serverless se debe usar PgBouncer en 6543 con pgbouncer=true.
  // Si detectamos el puerto directo 5432 sin PgBouncer, reescribimos defensivamente.
  if (url.includes('pooler.supabase.com:5432') && !url.includes('pgbouncer=')) {
    url = url.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');
  }
  if (url.includes('pooler.supabase.com:6543') && !url.includes('pgbouncer=')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}pgbouncer=true`;
  }
  // Forzar connection_limit bajo en serverless para no saturar el pool de PgBouncer.
  if (!url.includes('connection_limit=')) {
    const limit = process.env.VERCEL ? 1 : 5;
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}connection_limit=${limit}`;
  }
  if (!url.includes('pool_timeout=')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}pool_timeout=20`;
  }
  return url;
}

function maskUrl(url?: string): string | undefined {
  return url?.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@');
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const rawUrl = process.env.DATABASE_URL;
    const dbUrl = sanitizeDbUrl(rawUrl);

    if (dbUrl !== rawUrl) {
      console.log('[PrismaService] DATABASE_URL ajustada para PgBouncer/serverless:', maskUrl(dbUrl));
    }

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: process.env.VERCEL
        ? ['warn', 'error']
        : ['query', 'info', 'warn', 'error'],
    });

    // Singleton global para serverless: evita crear múltiples PrismaClient por invocación.
    if (globalForPrisma.__estratoPrisma) {
      // @ts-expect-error: constructor puede devolver una instancia existente en JS.
      return globalForPrisma.__estratoPrisma;
    }
    globalForPrisma.__estratoPrisma = this;
  }

  async onModuleDestroy() {
    // En serverless (Vercel) no desconectamos para mantener el pool cálido entre invocaciones.
    // Solo desconectamos en desarrollo/test.
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await this.$disconnect();
    }
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

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.__estratoPrisma) {
    const rawUrl = process.env.DATABASE_URL;
    const dbUrl = sanitizeDbUrl(rawUrl);
    globalForPrisma.__estratoPrisma = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: process.env.VERCEL ? ['warn', 'error'] : ['query', 'info', 'warn', 'error'],
    });
  }
  return globalForPrisma.__estratoPrisma;
}
