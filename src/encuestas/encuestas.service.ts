import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { EstatusEncuesta } from '@prisma/client';

const ESTATUS = Object.values(EstatusEncuesta);

function validarPreguntas(preguntas: any[]) {
  if (!Array.isArray(preguntas)) throw new BadRequestException('Las preguntas deben ser un arreglo');
  for (const p of preguntas) {
    if (!p.texto || !String(p.texto).trim()) {
      throw new BadRequestException('Toda pregunta debe tener un texto');
    }
    if (!['texto', 'opcion_unica', 'opcion_multiple', 'escala', 'si_no'].includes(p.tipo)) {
      throw new BadRequestException(`Tipo de pregunta inválido: ${p.tipo}`);
    }
    if (['opcion_unica', 'opcion_multiple'].includes(p.tipo) && (!Array.isArray(p.opciones) || p.opciones.length < 2)) {
      throw new BadRequestException(`La pregunta "${p.texto}" necesita al menos 2 opciones`);
    }
  }
}

@Injectable()
export class EncuestasService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any, tenantId: string) {
    const where: any = { tenant_id: tenantId };
    if (query.status && ESTATUS.includes(query.status)) where.status = query.status;
    if (query.q) where.titulo = { contains: query.q, mode: 'insensitive' };
    return this.prisma.encuesta.findMany({
      where,
      take: query.limit ? parseInt(query.limit, 10) : 200,
      orderBy: { created_at: 'desc' },
      include: {
        creador: { select: { id: true, nombre: true } },
        _count: { select: { respuestas: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const encuesta = await this.prisma.encuesta.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        creador: { select: { id: true, nombre: true } },
        _count: { select: { respuestas: true } },
      },
    });
    if (!encuesta) throw new NotFoundException('Encuesta no encontrada');
    return encuesta;
  }

  async create(data: any, tenantId: string, userId: string) {
    const titulo = String(data.titulo || '').trim();
    if (!titulo) throw new BadRequestException('El título de la encuesta es requerido');
    const preguntas = Array.isArray(data.preguntas) ? data.preguntas : [];
    validarPreguntas(preguntas);
    return this.prisma.encuesta.create({
      data: {
        tenant_id: tenantId,
        created_by: userId,
        titulo,
        descripcion: data.descripcion ? String(data.descripcion).trim() : null,
        status: ESTATUS.includes(data.status) ? data.status : 'borrador',
        preguntas,
      },
      include: { creador: { select: { id: true, nombre: true } } },
    });
  }

  async update(id: string, data: any, tenantId: string) {
    const encuesta = await this.findOne(id, tenantId);
    const payload: any = {};
    if (data.titulo !== undefined) {
      const titulo = String(data.titulo).trim();
      if (!titulo) throw new BadRequestException('El título es requerido');
      payload.titulo = titulo;
    }
    if (data.descripcion !== undefined) payload.descripcion = String(data.descripcion).trim() || null;
    if (data.status !== undefined && ESTATUS.includes(data.status)) payload.status = data.status;
    if (data.preguntas !== undefined) {
      validarPreguntas(data.preguntas);
      payload.preguntas = data.preguntas;
    }
    return this.prisma.encuesta.update({
      where: { id: encuesta.id },
      data: payload,
      include: { creador: { select: { id: true, nombre: true } }, _count: { select: { respuestas: true } } },
    });
  }

  async updateStatus(id: string, status: string, tenantId: string) {
    if (!ESTATUS.includes(status as any)) throw new BadRequestException('Estatus inválido');
    const encuesta = await this.findOne(id, tenantId);
    return this.prisma.encuesta.update({
      where: { id: encuesta.id },
      data: { status: status as EstatusEncuesta },
      include: { _count: { select: { respuestas: true } } },
    });
  }

  async remove(id: string, tenantId: string) {
    const encuesta = await this.findOne(id, tenantId);
    await this.prisma.respuestaEncuesta.deleteMany({ where: { encuesta_id: encuesta.id } });
    await this.prisma.encuesta.delete({ where: { id: encuesta.id } });
    return { ok: true };
  }

  async createRespuesta(id: string, data: any, tenantId: string, userId?: string) {
    const encuesta = await this.findOne(id, tenantId);
    if (encuesta.status !== 'activa') throw new BadRequestException('La encuesta no está activa');
    const respuestas = Array.isArray(data.respuestas) ? data.respuestas : [];
    const idsPreguntas = new Set((encuesta.preguntas as any[] || []).map((p) => p.id));
    for (const r of respuestas) {
      if (!idsPreguntas.has(r.pregunta_id)) {
        throw new BadRequestException(`Pregunta inválida en la respuesta: ${r.pregunta_id}`);
      }
    }
    return this.prisma.respuestaEncuesta.create({
      data: {
        tenant_id: tenantId,
        encuesta_id: encuesta.id,
        votante_id: data.votante_id || null,
        votante_nombre: data.votante_nombre ? String(data.votante_nombre).trim() : null,
        respuestas,
        coordenadas: data.coordenadas || null,
        created_by: userId || null,
      },
      include: { votante: { select: { id: true, nombre: true } } },
    });
  }

  async findRespuestas(id: string, query: any, tenantId: string) {
    const encuesta = await this.findOne(id, tenantId);
    return this.prisma.respuestaEncuesta.findMany({
      where: { encuesta_id: encuesta.id, tenant_id: tenantId },
      take: query.limit ? parseInt(query.limit, 10) : 500,
      orderBy: { created_at: 'desc' },
      include: { votante: { select: { id: true, nombre: true } } },
    });
  }

  async resumen(id: string, tenantId: string) {
    const encuesta = await this.findOne(id, tenantId);
    const respuestas = await this.prisma.respuestaEncuesta.findMany({
      where: { encuesta_id: encuesta.id, tenant_id: tenantId },
    });
    const preguntas = (encuesta.preguntas as any[] || []);
    const resumenPorPregunta = preguntas.map((p) => {
      const conteo: Record<string, number> = {};
      respuestas.forEach((r) => {
        const resp = (r.respuestas as any[] || []).find((x) => x.pregunta_id === p.id);
        if (!resp) return;
        (resp.valores || []).forEach((v) => {
          const k = String(v);
          conteo[k] = (conteo[k] || 0) + 1;
        });
      });
      return { ...p, total: respuestas.length, conteo };
    });
    return {
      encuesta: { id: encuesta.id, titulo: encuesta.titulo, status: encuesta.status },
      total_respuestas: respuestas.length,
      resumen: resumenPorPregunta,
    };
  }
}
