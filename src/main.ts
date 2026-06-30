import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { PrismaService } from './common/services/prisma.service';

@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  private extractMessage(exception: any): string {
    if (!exception) return 'Internal server error';

    if (typeof exception === 'string') return exception;

    // Preferir message limpio de HttpException
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object') {
        const msg = (response as any).message;
        if (typeof msg === 'string') return msg;
        if (Array.isArray(msg)) return msg.join('; ');
      }
      return exception.message || 'Error del servidor';
    }

    if (exception.message && typeof exception.message === 'string') {
      return exception.message;
    }

    // No exponer objetos/arrays crudos (pueden contener datos sensibles o coordenadas)
    return 'Error interno del servidor';
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    const message = this.extractMessage(exception);
    const stack = exception?.stack || '';

    this.logger.error(`[GLOBAL ERROR] ${request.method} ${request.url} → ${status}: ${message}\n${stack}`);

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
    });
  }
}

let cachedApp: any;
let swaggerDocument: OpenAPIObject | null = null;

async function createApp() {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create(AppModule);

  // Security middleware
  // Helmet disabled temporarily to troubleshoot Swagger UI on Vercel
  // app.use(helmet({
  //   contentSecurityPolicy: false,
  // }));
  app.use(compression());
  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // CORS — permitir localhost y cualquier deployment de Vercel del proyecto frontend
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://frontend-brown-tau-29.vercel.app',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      const isAllowed =
        !origin ||
        allowedOrigins.some((o) => origin.startsWith(o)) ||
        /^https:\/\/frontend-[a-z0-9]+-estrato-s-projects\.vercel\.app$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(e => Object.values(e.constraints || {}).join('; '));
      return new BadRequestException(messages);
    },
  }));

  // Global exception filter para loggear errores reales en serverless
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('ESTRATO API')
    .setDescription('API para campañas políticas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  swaggerDocument = SwaggerModule.createDocument(app, config);

  const httpAdapter = app.getHttpAdapter();

  // Health check simple para verificar que el backend responde
  httpAdapter.get('/health', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Health check de base de datos para diagnosticar conexión a Supabase
  httpAdapter.get('/health/db', async (req: any, res: any) => {
    try {
      const prisma = (app as any).get(PrismaService);
      const result = await prisma.$queryRaw`SELECT 1 as alive`;
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ status: 'ok', db: 'connected', result, timestamp: new Date().toISOString() });
    } catch (err: any) {
      res.setHeader('Content-Type', 'application/json');
      res.status(503).json({ status: 'error', db: 'disconnected', message: err?.message || String(err), timestamp: new Date().toISOString() });
    }
  });

  // Raw OpenAPI JSON
  httpAdapter.get('/api-json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // Swagger UI served inline (avoids static file issues on Vercel serverless)
  httpAdapter.get('/api/docs', (req: any, res: any) => {
    const specLiteral = JSON.stringify(swaggerDocument)
      .replace(/</g, '\\u003c');
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>ESTRATO API - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onSwaggerReady = function(SwaggerUIBundle) {
        const ui = SwaggerUIBundle({
          spec: ${specLiteral},
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.presets.standalone
          ],
          layout: 'BaseLayout'
        });
      };
      (function load() {
        if (typeof SwaggerUIBundle === 'undefined') {
          setTimeout(load, 100);
          return;
        }
        window.onSwaggerReady(SwaggerUIBundle);
      })();
    </script>
  </body>
</html>`);
  });

  await app.init();
  cachedApp = app;
  return app;
}

// For serverless (Vercel)
export default async function handler(req: any, res: any) {
  console.log('[vercel handler]', req.method, req.url, Date.now());
  // Health check rápido que no requiere inicializar Nest para diagnosticar cold-start
  if (req.url === '/' || req.url === '/health') {
    console.log('[vercel handler] respondiendo health check directo');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', source: 'vercel-handler', timestamp: new Date().toISOString() }));
    return;
  }

  console.log('[vercel handler] iniciando createApp');
  const app = await createApp();
  console.log('[vercel handler] createApp listo');
  const server = app.getHttpAdapter().getInstance();
  return server(req, res);
}

// For local development and traditional servers
async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`ESTRATO API running on port ${port}`);
}

// Only run bootstrap if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  bootstrap();
}
