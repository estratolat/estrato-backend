import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './common/services/prisma.service';

const RESCUE_SECRET = process.env.RESCUE_SECRET || 'estrato-rescue-2026';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  health() {
    return {
      status: 'ok',
      service: 'ESTRATO API',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('env-check')
  @ApiOperation({ summary: 'Verificar presencia de variables de entorno (sin exponer valores)' })
  envCheck() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY_2 || process.env.ANTHROPIC_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY_2 || process.env.OPENAI_API_KEY || '';
    return {
      anthropic_api_key_present: !!anthropicKey.trim(),
      anthropic_api_key_length: anthropicKey.length,
      anthropic_model: process.env.ANTHROPIC_MODEL || 'not-set',
      openai_api_key_present: !!openaiKey.trim(),
      node_env: process.env.NODE_ENV || 'not-set',
    };
  }

  @Post('rescue/create-superadmin')
  @ApiOperation({ summary: 'TEMPORAL: crear superadmin de rescate' })
  @UsePipes(new ValidationPipe({ whitelist: false, transform: false, forbidNonWhitelisted: false }))
  async createSuperadmin(
    @Body() body: { email?: string; password?: string; nombre?: string },
    @Headers('x-rescue-secret') secret: string,
  ) {
    if (secret !== RESCUE_SECRET) {
      throw new UnauthorizedException('Clave de rescate inválida');
    }

    const email = (body.email || 'superadmin@estrato.lat').trim().toLowerCase();
    const password = body.password || 'Estrato2026$';
    const nombre = body.nombre || 'Super Admin';

    if (!email || !password || password.length < 6) {
      throw new BadRequestException('Email y contraseña válidos requeridos');
    }

    // El superadmin necesita un tenant_id; usamos el primer tenant existente
    // o creamos uno de sistema si no hay ninguno.
    let tenant = await this.prisma.tenant.findFirst({ orderBy: { created_at: 'asc' } });
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          slug: 'sistema',
          url_completa: '',
          nombre_candidato: 'Sistema ESTRATO',
          plan: 'basico',
          activo: true,
        },
      });
    }

    const existente = await this.prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      const actualizado = await this.prisma.usuario.update({
        where: { id: existente.id },
        data: {
          password_hash: await bcrypt.hash(password, 10),
          rol: 'superadmin',
          permisos: ['admin'],
          activo: true,
          tenant_id: tenant.id,
        },
      });
      return {
        ok: true,
        accion: 'actualizado',
        user: { id: actualizado.id, email: actualizado.email, rol: actualizado.rol },
      };
    }

    const creado = await this.prisma.usuario.create({
      data: {
        tenant_id: tenant.id,
        email,
        nombre,
        password_hash: await bcrypt.hash(password, 10),
        rol: 'superadmin',
        permisos: ['admin'],
        activo: true,
      },
    });

    return {
      ok: true,
      accion: 'creado',
      user: { id: creado.id, email: creado.email, rol: creado.rol },
    };
  }
}
