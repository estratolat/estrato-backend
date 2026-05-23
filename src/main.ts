import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

let cachedApp: any;

async function createApp() {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('ESTRATO API')
    .setDescription('API para campañas políticas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  cachedApp = app;
  return app;
}

// For serverless (Vercel)
export default async function handler(req: any, res: any) {
  const app = await createApp();
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
