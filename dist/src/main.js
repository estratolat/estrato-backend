"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = require("express");
const app_module_1 = require("./app.module");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    extractMessage(exception) {
        if (!exception)
            return 'Internal server error';
        if (typeof exception === 'string')
            return exception;
        if (exception instanceof common_1.HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'string')
                return response;
            if (response && typeof response === 'object') {
                const msg = response.message;
                if (typeof msg === 'string')
                    return msg;
                if (Array.isArray(msg))
                    return msg.join('; ');
            }
            return exception.message || 'Error del servidor';
        }
        if (exception.message && typeof exception.message === 'string') {
            return exception.message;
        }
        return 'Error interno del servidor';
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : 500;
        const message = this.extractMessage(exception);
        const stack = exception?.stack || '';
        this.logger.error(`[GLOBAL ERROR] ${request.method} ${request.url} → ${status}: ${message}\n${stack}`);
        response.status(status).json({
            statusCode: status,
            message,
            path: request.url,
        });
    }
};
GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
let cachedApp;
let swaggerDocument = null;
async function createApp() {
    if (cachedApp)
        return cachedApp;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, compression_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' }));
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'https://frontend-brown-tau-29.vercel.app',
    ].filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            const isAllowed = !origin ||
                allowedOrigins.some((o) => origin.startsWith(o)) ||
                /^https:\/\/frontend-[a-z0-9]+-estrato-s-projects\.vercel\.app$/.test(origin);
            if (isAllowed) {
                callback(null, true);
            }
            else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
            const messages = errors.map(e => Object.values(e.constraints || {}).join('; '));
            return new common_1.BadRequestException(messages);
        },
    }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('ESTRATO API')
        .setDescription('API para campañas políticas')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    swaggerDocument = swagger_1.SwaggerModule.createDocument(app, config);
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/health', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    httpAdapter.get('/api-json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerDocument);
    });
    httpAdapter.get('/api/docs', (req, res) => {
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
async function handler(req, res) {
    const app = await createApp();
    const server = app.getHttpAdapter().getInstance();
    return server(req, res);
}
async function bootstrap() {
    const app = await createApp();
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`ESTRATO API running on port ${port}`);
}
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    bootstrap();
}
//# sourceMappingURL=main.js.map