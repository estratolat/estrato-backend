import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/services/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
      include: { tenant: true, zona: { select: { id: true, nombre: true } } },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    let isPasswordValid = false;

    if (user.password_hash) {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password_hash, ...result } = user;
    return result;
  }

  async validateBrigadaUser(telefono: string, pin: string): Promise<any> {
    const digits = String(telefono || '').replace(/\D/g, '');
    const user = await this.prisma.usuario.findFirst({
      where: {
        telefono: { contains: digits, mode: 'insensitive' },
        activo: true,
        rol: { in: ['brigadista', 'coord_zona', 'coord_general'] },
      },
      include: { tenant: true, zona: { select: { id: true, nombre: true } } },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Comparación directa del PIN; en producción hash con bcrypt
    const isPinValid = String(user.pin || '').trim() === String(pin || '').trim();

    if (!isPinValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password_hash, ...result } = user;
    return result;
  }

  login(user: any) {
    const permisos = Array.isArray(user.permisos)
      ? user.permisos
      : this.permisosPorRol(user.rol);

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      tenant_id: user.tenant_id,
      tenant_slug: user.tenant?.slug,
      permisos,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        tenant_id: user.tenant_id,
        tenant_slug: user.tenant?.slug,
        zona_id: user.zona_id,
        permisos,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { tenant: true, zona: { select: { id: true, nombre: true } } },
    });
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async aceptarInvitacion(token: string, password: string) {
    if (!password || password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { invitation_token: token },
      include: { tenant: true },
    });

    if (!usuario) {
      throw new BadRequestException('Token de invitación inválido');
    }

    if (usuario.invitation_expires_at && new Date() > usuario.invitation_expires_at) {
      throw new BadRequestException('El enlace de invitación ha expirado');
    }

    const password_hash = await bcrypt.hash(password, 10);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        password_hash,
        invitation_token: null,
        invitation_expires_at: null,
      },
    });

    return {
      mensaje: 'Cuenta activada correctamente',
      email: usuario.email,
      tenant_slug: usuario.tenant?.slug,
    };
  }

  private permisosPorRol(rol: string): string[] {
    const defaults: Record<string, string[]> = {
      owner: [
        'dashboard',
        'votantes',
        'crm',
        'peticiones',
        'eventos',
        'mapa',
        'boletines',
        'llamadas',
        'candidato',
        'encuestas',
        'casillas',
        'monitoreo',
        'proyeccion',
        'ficha_seccional',
        'historico_electoral',
        'inteligencia_electoral',
        'opositores',
        'data',
        'usuarios',
        'app_brigada',
      ],
      candidato: [
        'dashboard',
        'votantes',
        'crm',
        'peticiones',
        'eventos',
        'mapa',
        'boletines',
        'llamadas',
        'candidato',
        'encuestas',
        'casillas',
        'monitoreo',
        'proyeccion',
        'ficha_seccional',
        'historico_electoral',
        'inteligencia_electoral',
        'opositores',
        'data',
        'usuarios',
        'app_brigada',
      ],
      coord_general: [
        'dashboard',
        'votantes',
        'crm',
        'peticiones',
        'eventos',
        'mapa',
        'boletines',
        'llamadas',
        'encuestas',
        'casillas',
        'monitoreo',
        'proyeccion',
        'ficha_seccional',
        'historico_electoral',
        'inteligencia_electoral',
        'opositores',
        'data',
        'app_brigada',
      ],
      coord_zona: [
        'dashboard',
        'votantes',
        'crm',
        'peticiones',
        'eventos',
        'mapa',
        'encuestas',
        'casillas',
        'monitoreo',
        'ficha_seccional',
        'app_brigada',
      ],
      brigadista: ['app_brigada'],
      cm: [
        'dashboard',
        'crm',
        'peticiones',
        'boletines',
        'candidato',
        'encuestas',
        'monitoreo',
        'proyeccion',
        'ficha_seccional',
        'historico_electoral',
        'inteligencia_electoral',
        'opositores',
        'data',
      ],
      encargado_peticiones: [
        'dashboard',
        'peticiones',
        'votantes',
        'crm',
        'mapa',
        'encuestas',
        'monitoreo',
        'ficha_seccional',
      ],
      superadmin: ['admin'],
    };
    return defaults[rol] || [];
  }
}
