import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

const ZONA_TIPOS_VALIDOS = ['propia', 'externa', 'neutral'];

@Injectable()
export class ZonasService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.zona.findMany({
      where: { tenant_id: tenantId },
      include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const zona = await this.prisma.zona.findFirst({
      where: { id, tenant_id: tenantId },
      include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
    });
    if (!zona) throw new NotFoundException('Zona no encontrada');
    return zona;
  }

  async create(data: any, tenantId: string, userId?: string) {
    const payload = this.normalizar(data, tenantId, userId);
    return this.prisma.zona.create({
      data: payload,
      include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
    });
  }

  async update(id: string, data: any, tenantId: string, userId?: string) {
    await this.findOne(id, tenantId); // valida existencia y tenant
    const payload = this.normalizar(data, tenantId, userId, true);
    return this.prisma.zona.update({
      where: { id },
      data: payload,
      include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    // Desactivar en lugar de borrar para conservar histórico y relaciones.
    return this.prisma.zona.update({
      where: { id },
      data: { activa: false },
    });
  }

  private normalizar(data: any, tenantId: string, userId?: string, esUpdate = false) {
    const payload: any = {};

    if (!esUpdate) {
      payload.tenant_id = tenantId;
      payload.activa = true;
    }

    if (data.nombre !== undefined) payload.nombre = String(data.nombre).trim();
    if (data.secciones !== undefined) {
      payload.secciones = Array.isArray(data.secciones)
        ? data.secciones.map(String).filter(Boolean)
        : [];
    }

    if (data.coordenadas !== undefined) {
      if (data.coordenadas === null) {
        payload.coordenadas = null;
      } else {
        this.validarPolygon(data.coordenadas);
        payload.coordenadas = data.coordenadas;
      }
    }

    if (data.color !== undefined) payload.color = String(data.color).trim();
    if (data.activa !== undefined) payload.activa = Boolean(data.activa);

    if (data.tipo !== undefined) {
      const tipo = String(data.tipo).trim().toLowerCase();
      if (!ZONA_TIPOS_VALIDOS.includes(tipo)) {
        throw new BadRequestException(`Tipo de zona inválido: ${tipo}`);
      }
      payload.tipo = tipo;
    }

    if (data.lider_id !== undefined) {
      payload.lider_id = data.lider_id || null;
    }

    if (data.meta_votos !== undefined) payload.meta_votos = this.parsearEntero(data.meta_votos);
    if (data.votos_estimados !== undefined) payload.votos_estimados = this.parsearEntero(data.votos_estimados);
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion ? String(data.descripcion).trim() : null;
    if (data.orden !== undefined) payload.orden = this.parsearEntero(data.orden, 0);

    if (userId && !esUpdate) payload.created_by = userId;

    return payload;
  }

  private validarPolygon(geojson: any) {
    if (!geojson || typeof geojson !== 'object') {
      throw new BadRequestException('Las coordenadas deben ser un objeto GeoJSON');
    }
    if (geojson.type !== 'Polygon' && geojson.type !== 'MultiPolygon') {
      throw new BadRequestException('Las coordenadas de zona deben ser Polygon o MultiPolygon');
    }
    if (!Array.isArray(geojson.coordinates)) {
      throw new BadRequestException('GeoJSON inválido: falta coordinates');
    }
  }

  private parsearEntero(value: any, defaultValue?: number): number | null {
    if (value === null || value === undefined || value === '') return defaultValue ?? null;
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return defaultValue ?? null;
    return n;
  }
}
