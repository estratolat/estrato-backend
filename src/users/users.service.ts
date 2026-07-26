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
  'encargado_peticiones',
  'superadmin',
];

const PERMISOS_POR_ROL: Record<UserRole, string[]> = {
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

export const SECCIONES_DISPONIBLES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', color: '#B91C1C' },
  { id: 'votantes', label: 'Votantes', icon: 'votantes', color: '#2563EB' },
  { id: 'crm', label: 'CRM', icon: 'crm', color: '#16A34A' },
  { id: 'peticiones', label: 'Operaciones', icon: 'apoyos', color: '#06B6D4' },
  { id: 'eventos', label: 'Eventos', icon: 'eventos', color: '#7C3AED' },
  { id: 'mapa', label: 'Mapa Territorial', icon: 'mapa', color: '#EA580C' },
  { id: 'boletines', label: 'Boletines IA', icon: 'boletines', color: '#0369A1' },
  { id: 'llamadas', label: 'Llamadas', icon: 'llamadas', color: '#9F1239' },
  { id: 'candidato', label: 'Perfil del Candidato', icon: 'user', color: '#BE185D' },
  { id: 'encuestas', label: 'Encuestas', icon: 'crm', color: '#D97706' },
  { id: 'casillas', label: 'Casillas', icon: 'mapa', color: '#DB2777' },
  { id: 'monitoreo', label: 'Monitoreo', icon: 'dashboard', color: '#0891B2' },
  { id: 'proyeccion', label: 'Proyección', icon: 'historico', color: '#0F766E' },
  { id: 'ficha_seccional', label: 'Ficha Seccional', icon: 'votantes', color: '#C2410C' },
  { id: 'historico_electoral', label: 'Histórico Electoral', icon: 'historico', color: '#4338CA' },
  { id: 'inteligencia_electoral', label: 'Inteligencia Electoral', icon: 'historico', color: '#9333EA' },
  { id: 'opositores', label: 'Opositores', icon: 'opositores', color: '#DC2626' },
  { id: 'usuarios', label: 'Configuración / Usuarios', icon: 'seguridad', color: '#475569' },
  { id: 'app_brigada', label: 'App de Brigada', icon: 'app', color: '#000000' },
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
      throw new BadRequestException('La contraseña es obligatoria para crear un usuario');
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
