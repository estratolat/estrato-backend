import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { EstatusEncuesta } from '@prisma/client';
import { parse } from 'csv-parse/sync';

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

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function normalizarRespuestas(respuestas: any[], preguntas: any[]) {
  if (!Array.isArray(respuestas)) throw new BadRequestException('Las respuestas deben ser un arreglo');
  const idsPreguntas = new Set((preguntas || []).map((p) => p.id));
  const requeridas = new Set((preguntas || []).filter((p) => p.requerida).map((p) => p.id));
  for (const r of respuestas) {
    if (!idsPreguntas.has(r.pregunta_id)) {
      throw new BadRequestException(`Pregunta inválida en la respuesta: ${r.pregunta_id}`);
    }
  }
  for (const p of preguntas || []) {
    if (requeridas.has(p.id)) {
      const resp = respuestas.find((r) => r.pregunta_id === p.id);
      const valores = Array.isArray(resp?.valores) ? resp.valores : [];
      if (valores.length === 0 || valores.every((v: any) => v === '' || v === null || v === undefined)) {
        throw new BadRequestException(`La pregunta "${p.texto}" es obligatoria`);
      }
    }
  }
  return respuestas;
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
        tenant: { select: { id: true, slug: true, nombre_candidato: true } },
        _count: { select: { respuestas: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const encuesta = await this.prisma.encuesta.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        creador: { select: { id: true, nombre: true } },
        tenant: { select: { id: true, slug: true, nombre_candidato: true } },
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
      include: {
        creador: { select: { id: true, nombre: true } },
        tenant: { select: { id: true, slug: true, nombre_candidato: true } },
        _count: { select: { respuestas: true } },
      },
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
    const respuestas = normalizarRespuestas(data.respuestas, encuesta.preguntas as any[]);
    return this.prisma.respuestaEncuesta.create({
      data: {
        tenant_id: tenantId,
        encuesta_id: encuesta.id,
        votante_id: data.votante_id || null,
        votante_nombre: data.votante_nombre ? String(data.votante_nombre).trim() : null,
        email: data.email ? String(data.email).trim().toLowerCase() : null,
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
      let respondieron = 0;
      respuestas.forEach((r) => {
        const resp = (r.respuestas as any[] || []).find((x) => x.pregunta_id === p.id);
        if (!resp || !Array.isArray(resp.valores) || resp.valores.length === 0) return;
        respondieron++;
        (resp.valores || []).forEach((v) => {
          const k = String(v);
          conteo[k] = (conteo[k] || 0) + 1;
        });
      });
      const total = respuestas.length;
      const distribucion = Object.entries(conteo).map(([valor, cantidad]) => ({
        valor,
        cantidad,
        porcentaje: total > 0 ? Math.round((cantidad / total) * 1000) / 10 : 0,
      }));
      return { ...p, total, respondieron, distribucion, conteo };
    });
    return {
      encuesta: { id: encuesta.id, titulo: encuesta.titulo, status: encuesta.status },
      total_respuestas: respuestas.length,
      resumen: resumenPorPregunta,
    };
  }

  // ==========================================
  // FLUJO PÚBLICO DE RESPUESTAS
  // ==========================================
  async findPublic(slug: string, encuestaId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !tenant.activo) throw new NotFoundException('Proyecto no encontrado');
    const encuesta = await this.prisma.encuesta.findFirst({
      where: { id: encuestaId, tenant_id: tenant.id, status: 'activa' },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        status: true,
        preguntas: true,
        tenant_id: true,
      },
    });
    if (!encuesta) throw new NotFoundException('Encuesta no encontrada o no está activa');
    return {
      tenant: { id: tenant.id, nombre: tenant.nombre_candidato, slug: tenant.slug },
      encuesta,
    };
  }

  async createRespuestaPublica(slug: string, encuestaId: string, data: any) {
    const { encuesta, tenant } = await this.findPublic(slug, encuestaId);
    const email = String(data.email || '').trim().toLowerCase();
    if (!email || !validarEmail(email)) {
      throw new BadRequestException('Correo electrónico inválido');
    }
    const existe = await this.prisma.respuestaEncuesta.findFirst({
      where: { encuesta_id: encuesta.id, email },
    });
    if (existe) {
      throw new BadRequestException('Este correo ya contestó la encuesta');
    }
    const respuestas = normalizarRespuestas(data.respuestas, encuesta.preguntas as any[]);
    return this.prisma.respuestaEncuesta.create({
      data: {
        tenant_id: tenant.id,
        encuesta_id: encuesta.id,
        email,
        respuestas,
        coordenadas: data.coordenadas || null,
      },
      select: { id: true, created_at: true },
    });
  }

  // ==========================================
  // BASE DE CONTACTOS REUTILIZABLE
  // ==========================================
  async findContactos(query: any, tenantId: string) {
    const where: any = { tenant_id: tenantId };
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { telefono: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.encuestaContacto.findMany({
      where,
      take: query.limit ? parseInt(query.limit, 10) : 500,
      orderBy: { created_at: 'desc' },
    });
  }

  async importarContactos(tenantId: string, buffer: Buffer) {
    const text = buffer.toString('utf-8');
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];
    let importados = 0;
    let omitidos = 0;
    for (const r of records) {
      const email = String(
        r.email || r.Email || r.EMAIL || r.correo || r.Correo || r['Correo electrónico'] || ''
      ).trim().toLowerCase();
      if (!email || !validarEmail(email)) {
        omitidos++;
        continue;
      }
      const nombre = String(
        r.nombre || r.Nombre || r.name || r.Name || r.nombres || r.Nombres || ''
      ).trim() || null;
      const telefono = String(
        r.telefono || r.Telefono || r.tel || r.phone || r.celular || r.Celular || ''
      ).trim() || null;
      await this.prisma.encuestaContacto.upsert({
        where: { tenant_id_email: { tenant_id: tenantId, email } },
        update: { nombre, telefono, metadata: r },
        create: { tenant_id: tenantId, email, nombre, telefono, metadata: r },
      });
      importados++;
    }
    return { importados, omitidos, total: records.length };
  }

  // ==========================================
  // COMPARTIR / ENVÍOS
  // ==========================================
  async compartir(tenantId: string, encuestaId: string, data: any) {
    await this.findOne(encuestaId, tenantId); // verifica existencia y pertenencia
    const canal = ['whatsapp', 'email', 'link'].includes(data.canal) ? data.canal : 'whatsapp';
    const envios: any[] = [];
    if (Array.isArray(data.contactos) && data.contactos.length > 0) {
      for (const c of data.contactos) {
        envios.push({
          tenant_id: tenantId,
          encuesta_id: encuestaId,
          contacto_id: c.id || null,
          destinatario: c.destinatario || c.email || c.telefono || null,
          canal,
          estado: 'enviado',
        });
      }
    } else {
      envios.push({
        tenant_id: tenantId,
        encuesta_id: encuestaId,
        contacto_id: null,
        destinatario: data.destinatario || null,
        canal,
        estado: 'enviado',
      });
    }
    await this.prisma.encuestaEnvio.createMany({ data: envios });
    return { enviados: envios.length };
  }

  async findEnvios(encuestaId: string, tenantId: string) {
    await this.findOne(encuestaId, tenantId);
    return this.prisma.encuestaEnvio.findMany({
      where: { encuesta_id: encuestaId, tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      take: 1000,
    });
  }
}
