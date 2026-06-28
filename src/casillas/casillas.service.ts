import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { TipoCasilla } from '@prisma/client';

const TIPOS = Object.values(TipoCasilla);
const STATUS = ['sin_reportar', 'abierta', 'cerrada', 'incidencia'];

@Injectable()
export class CasillasService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any, tenantId: string) {
    const where: any = { tenant_id: tenantId };
    if (query.seccion) where.seccion = String(query.seccion);
    if (query.tipo && TIPOS.includes(query.tipo)) where.tipo = query.tipo;
    if (query.status && STATUS.includes(query.status)) where.status = query.status;
    if (query.q) {
      where.OR = [
        { ubicacion: { contains: query.q, mode: 'insensitive' } },
        { direccion: { contains: query.q, mode: 'insensitive' } },
        { referencia: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.casilla.findMany({
      where,
      take: query.limit ? parseInt(query.limit, 10) : 500,
      orderBy: [{ seccion: 'asc' }, { tipo: 'asc' }, { numero: 'asc' }],
      include: { responsable: { select: { id: true, nombre: true } } },
    });
  }

  async findOne(id: string, tenantId: string) {
    const casilla = await this.prisma.casilla.findFirst({
      where: { id, tenant_id: tenantId },
      include: { responsable: { select: { id: true, nombre: true } } },
    });
    if (!casilla) throw new NotFoundException('Casilla no encontrada');
    return casilla;
  }

  buildPayload(data: any) {
    const payload: any = {};
    if (data.seccion !== undefined) payload.seccion = String(data.seccion).trim();
    if (data.tipo !== undefined && TIPOS.includes(data.tipo)) payload.tipo = data.tipo;
    if (data.numero !== undefined) payload.numero = String(data.numero || '').trim() || null;
    if (data.ubicacion !== undefined) payload.ubicacion = String(data.ubicacion || '').trim() || null;
    if (data.direccion !== undefined) payload.direccion = String(data.direccion || '').trim() || null;
    if (data.coordenadas !== undefined) payload.coordenadas = data.coordenadas || null;
    if (data.referencia !== undefined) payload.referencia = String(data.referencia || '').trim() || null;
    if (data.mesa_directiva !== undefined) payload.mesa_directiva = String(data.mesa_directiva || '').trim() || null;
    if (data.horario_apertura !== undefined) payload.horario_apertura = data.horario_apertura ? new Date(data.horario_apertura) : null;
    if (data.horario_cierre !== undefined) payload.horario_cierre = data.horario_cierre ? new Date(data.horario_cierre) : null;
    if (data.electores_esperados !== undefined) payload.electores_esperados = data.electores_esperados ? parseInt(data.electores_esperados, 10) : null;
    if (data.responsable_id !== undefined) payload.responsable_id = data.responsable_id || null;
    if (data.notas !== undefined) payload.notas = String(data.notas || '').trim() || null;
    if (data.status !== undefined && STATUS.includes(data.status)) payload.status = data.status;
    if (data.incidencia !== undefined) payload.incidencia = String(data.incidencia || '').trim() || null;
    return payload;
  }

  async create(data: any, tenantId: string) {
    if (!data.seccion) throw new BadRequestException('La sección es requerida');
    const payload = this.buildPayload(data);
    return this.prisma.casilla.create({
      data: { tenant_id: tenantId, ...payload },
      include: { responsable: { select: { id: true, nombre: true } } },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    const casilla = await this.findOne(id, tenantId);
    const payload = this.buildPayload(data);
    return this.prisma.casilla.update({
      where: { id: casilla.id },
      data: payload,
      include: { responsable: { select: { id: true, nombre: true } } },
    });
  }

  async updateStatus(id: string, status: string, incidencia: string | undefined, tenantId: string) {
    if (!STATUS.includes(status)) throw new BadRequestException('Estatus inválido');
    const casilla = await this.findOne(id, tenantId);
    const payload: any = { status };
    if (status === 'incidencia' && incidencia) payload.incidencia = String(incidencia).trim();
    if (status !== 'incidencia') payload.incidencia = null;
    return this.prisma.casilla.update({ where: { id: casilla.id }, data: payload });
  }

  async remove(id: string, tenantId: string) {
    const casilla = await this.findOne(id, tenantId);
    await this.prisma.casilla.delete({ where: { id: casilla.id } });
    return { ok: true };
  }

  async importar(data: any[], tenantId: string) {
    if (!Array.isArray(data) || data.length === 0) throw new BadRequestException('Arreglo vacío');
    const creadas = [];
    for (const item of data) {
      if (!item.seccion) continue;
      creadas.push(
        await this.prisma.casilla.create({
          data: {
            tenant_id: tenantId,
            seccion: String(item.seccion).trim(),
            tipo: TIPOS.includes(item.tipo) ? item.tipo : 'basica',
            numero: item.numero ? String(item.numero).trim() : null,
            ubicacion: item.ubicacion ? String(item.ubicacion).trim() : null,
            direccion: item.direccion ? String(item.direccion).trim() : null,
            coordenadas: item.coordenadas || null,
            referencia: item.referencia ? String(item.referencia).trim() : null,
            electores_esperados: item.electores_esperados ? parseInt(item.electores_esperados, 10) : null,
            responsable_id: item.responsable_id || null,
          },
        }),
      );
    }
    return { creadas: creadas.length };
  }
}
