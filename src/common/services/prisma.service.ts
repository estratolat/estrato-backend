import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = global as unknown as { __estratoPrisma?: PrismaService };

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

function isAccelerateUrl(url?: string): boolean {
  return Boolean(url?.includes('.accelerate.prisma-data.net'));
}

function sanitizeDbUrl(url?: string): string | undefined {
  if (!url) return url;

  // Si usamos Prisma Accelerate, no forzar pgbouncer ni limitar conexiones:
  // Accelerate maneja su propio pool y nos da la URL con el protocolo prisma://.
  if (isAccelerateUrl(url)) {
    // La URL de Accelerate NO debe llevar pgbouncer/connection_limit/pool_timeout.
    url = removeSearchParam(url, 'pgbouncer');
    url = removeSearchParam(url, 'connection_limit');
    url = removeSearchParam(url, 'pool_timeout');
    url = removeSearchParam(url, 'prepare_threshold');
    return url;
  }

  // Supabase Pooler: usar Transaction Pooler 6543 + pgbouncer=true.
  if (url.includes('pooler.supabase.com:5432')) {
    url = url.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');
  }
  url = setSearchParam(url, 'pgbouncer', 'true');
  // PgBouncer no soporta prepared statements; desactivarlos evita errores de protocolo.
  url = setSearchParam(url, 'prepare_threshold', '0');

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
    console.log('[PrismaService] DATABASE_URL ajustada:', maskUrl(dbUrl));
  }

  const logLevels: Array<'query' | 'info' | 'warn' | 'error'> = process.env.VERCEL
    ? ['warn', 'error']
    : ['query', 'info', 'warn', 'error'];

  return {
    datasources: { db: { url: dbUrl } },
    log: logLevels,
  };
}

const MAX_RETRIES = 3;
const RETRYABLE_MESSAGES = [
  'EDBHANDLEREXITED',
  "Can't reach database server",
  'connection',
  'pooler',
  'pool_timeout',
  'DbHandler exited',
  'server closed the connection',
  'Connection terminated',
];

function isRetryableError(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err);
  return RETRYABLE_MESSAGES.some(m => msg.toLowerCase().includes(m.toLowerCase()));
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Singleton global para serverless: evita crear múltiples PrismaClient por invocación.
    if (globalForPrisma.__estratoPrisma) {
      return globalForPrisma.__estratoPrisma;
    }

    const config = getPrismaClientConfig();
    const usingAccelerate = isAccelerateUrl(config.datasources.db.url);

    if (usingAccelerate) {
      // @ts-expect-error: PrismaClient extendido con Accelerate tiene tipos extendidos.
      super(config);
      const extended = (this as any).$extends(withAccelerate());
      // Reemplazamos métodos del PrismaClient base por los del cliente extendido.
      Object.setPrototypeOf(extended, PrismaService.prototype);
      Object.assign(this, extended);
      this.logger.log('[PrismaService] Usando Prisma Accelerate para pool de conexiones.');
    } else {
      super(config);
      this.registerRetryMiddleware();
    }

    globalForPrisma.__estratoPrisma = this;
  }

  private registerRetryMiddleware() {
    // Prisma middleware intercepta cada query para reconectar ante fallos transitorios del pooler.
    this.$use(async (params, next) => {
      let lastError: unknown;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          return await next(params);
        } catch (err) {
          lastError = err;
          if (!isRetryableError(err) || attempt === MAX_RETRIES - 1) {
            throw err;
          }
          const delay = 200 * (attempt + 1);
          this.logger.warn(
            `[Prisma retry ${attempt + 1}/${MAX_RETRIES - 1}] ${(err as any)?.message || err}`
          );
          // Forzar reconexión limpia ante errores de pooler.
          await this.$disconnect().catch(() => {});
          await new Promise(r => setTimeout(r, delay));
          await this.$connect().catch(() => {});
        }
      }
      throw lastError;
    });
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

export function getPrismaClient(): PrismaService {
  if (!globalForPrisma.__estratoPrisma) {
    globalForPrisma.__estratoPrisma = new PrismaService();
  }
  return globalForPrisma.__estratoPrisma;
}
