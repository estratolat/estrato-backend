import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

const ROLES_VALIDOS: UserRole[] = [
  'owner',
  'candidato',
  'coord_general',
  'coord_zona',
  'brigadista',
  'cm',
  'superadmin',
];

const PERMISOS_POR_ROL: Record<UserRole, string[]> = {
  owner: [
    'dashboard',
    'votantes',
    'crm',
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
    'usuarios',
    'app_brigada',
  ],
  candidato: [
    'dashboard',
    'votantes',
    'crm',
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
    'usuarios',
    'app_brigada',
  ],
  coord_general: [
    'dashboard',
    'votantes',
    'crm',
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
    'app_brigada',
  ],
  coord_zona: [
    'dashboard',
    'votantes',
    'crm',
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
    'boletines',
    'candidato',
    'encuestas',
    'monitoreo',
    'proyeccion',
    'ficha_seccional',
    'historico_electoral',
    'inteligencia_electoral',
  ],
  superadmin: ['admin'],
};

export const SECCIONES_DISPONIBLES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'votantes', label: 'Votantes', icon: 'votantes' },
  { id: 'crm', label: 'CRM', icon: 'crm' },
  { id: 'eventos', label: 'Eventos', icon: 'eventos' },
  { id: 'mapa', label: 'Mapa Territorial', icon: 'mapa' },
  { id: 'boletines', label: 'Boletines IA', icon: 'boletines' },
  { id: 'llamadas', label: 'Llamadas', icon: 'llamadas' },
  { id: 'candidato', label: 'Perfil del Candidato', icon: 'user' },
  { id: 'encuestas', label: 'Encuestas', icon: 'crm' },
  { id: 'casillas', label: 'Casillas', icon: 'mapa' },
  { id: 'monitoreo', label: 'Monitoreo', icon: 'dashboard' },
  { id: 'proyeccion', label: 'Proyección', icon: 'historico' },
  { id: 'ficha_seccional', label: 'Ficha Seccional', icon: 'votantes' },
  { id: 'historico_electoral', label: 'Histórico Electoral', icon: 'historico' },
  { id: 'inteligencia_electoral', label: 'Inteligencia Electoral', icon: 'historico' },
  { id: 'usuarios', label: 'Configuración / Usuarios', icon: 'seguridad' },
  { id: 'app_brigada', label: 'App de Brigada', icon: 'app' },
];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.usuario.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ activo: 'desc' }, { created_at: 'desc' }],
      include: {
        zona: { select: { id: true, nombre: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        zona: { select: { id: true, nombre: true } },
      },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async create(data: any, tenantId: string, creadorId?: string) {
    const payload = await this.normalizar(data, tenantId, false, creadorId);

    // Evitar duplicados de email dentro del tenant
    const existente = await this.prisma.usuario.findUnique({
      where: { email: payload.email },
    });
    if (existente) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    return this.prisma.usuario.create({
      data: payload,
      include: { zona: { select: { id: true, nombre: true } } },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId); // valida existencia y tenant
    const payload = await this.normalizar(data, tenantId, true);

    // Si se cambia el email, validar duplicado
    if (payload.email) {
      const existente = await this.prisma.usuario.findFirst({
        where: { email: payload.email, id: { not: id } },
      });
      if (existente) {
        throw new BadRequestException('Ya existe otro usuario con ese email');
      }
    }

    return this.prisma.usuario.update({
      where: { id },
      data: payload,
      include: { zona: { select: { id: true, nombre: true } } },
    });
  }

  async remove(id: string, tenantId: string, ejecutorId?: string) {
    if (id === ejecutorId) {
      throw new ForbiddenException('No puedes desactivar tu propio usuario');
    }
    await this.findOne(id, tenantId);
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      include: { zona: { select: { id: true, nombre: true } } },
    });
  }

  permisosPorRol(rol: UserRole): string[] {
    return PERMISOS_POR_ROL[rol] || [];
  }

  private async normalizar(
    data: any,
    tenantId: string,
    esUpdate = false,
    creadorId?: string,
  ) {
    const payload: any = {};

    if (!esUpdate) {
      payload.tenant_id = tenantId;
      payload.activo = true;
    }

    if (data.email !== undefined) {
      payload.email = String(data.email).trim().toLowerCase();
    }

    if (data.nombre !== undefined) {
      payload.nombre = String(data.nombre).trim() || null;
    }

    if (data.telefono !== undefined) {
      payload.telefono = data.telefono ? String(data.telefono).trim() : null;
    }

    if (data.pin !== undefined) {
      payload.pin = data.pin ? String(data.pin).trim() : null;
    }

    if (data.password !== undefined) {
      const password = data.password ? String(data.password) : null;
      if (password && password.length > 0) {
        payload.password_hash = await bcrypt.hash(password, 10);
      }
    }

    if (!esUpdate && !payload.password_hash) {
      // Contraseña inicial por defecto para compatibilidad con demo
      payload.password_hash = await bcrypt.hash('demo123', 10);
    }

    if (data.rol !== undefined) {
      const rol = String(data.rol).trim().toLowerCase() as UserRole;
      if (!ROLES_VALIDOS.includes(rol)) {
        throw new BadRequestException(`Rol inválido: ${data.rol}`);
      }
      payload.rol = rol;
    }

    if (data.zona_id !== undefined) {
      payload.zona_id = data.zona_id || null;
      if (payload.zona_id) {
        const zona = await this.prisma.zona.findFirst({
          where: { id: payload.zona_id, tenant_id: tenantId },
        });
        if (!zona) throw new BadRequestException('Zona no encontrada para este tenant');
      }
    }

    if (data.permisos !== undefined) {
      const permisos = Array.isArray(data.permisos)
        ? data.permisos.filter((p: any) => typeof p === 'string' && p.length > 0)
        : [];
      payload.permisos = permisos.length > 0 ? permisos : null;
    }

    if (data.activo !== undefined) {
      payload.activo = Boolean(data.activo);
    }

    // Si se asignó rol y no se enviaron permisos personalizados, aplicar defaults
    if (payload.rol && data.permisos === undefined && !esUpdate) {
      payload.permisos = this.permisosPorRol(payload.rol);
    }

    return payload;
  }
}
