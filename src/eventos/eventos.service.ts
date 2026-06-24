import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any, tenantId: string) {
    return this.prisma.evento.findMany({
      where: { tenant_id: tenantId },
      orderBy: { fecha_inicio: 'desc' },
      take: query.limit ? parseInt(query.limit) : 100,
    });
  }

  async findOne(id: string, tenantId: string) {
    const evento = await this.prisma.evento.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        asistencias: {
          include: { votante: true },
          orderBy: { created_at: 'desc' },
        },
      },
    });
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }
    return evento;
  }

  async create(data: any, tenantId: string, userId?: string) {
    const payload = this.normalizarEvento(data, tenantId, userId);
    return this.prisma.evento.create({ data: payload });
  }

  async update(id: string, data: any, tenantId: string) {
    const evento = await this.findOne(id, tenantId);
    const payload = { ...data };
    delete payload.id;
    delete payload.tenant_id;
    delete payload.created_at;
    delete payload.qr_code;
    delete payload.asistencias;

    payload.tematica = payload.tematica ? String(payload.tematica).trim() : null;
    payload.zona_id = payload.zona_id || null;
    payload.lider_id = payload.lider_id || null;
    payload.generar_ficha = payload.generar_ficha === true || payload.generar_ficha === 'true';

    if (payload.generar_ficha && !payload.ficha_informativa) {
      payload.ficha_informativa = this.generarFichaInformativa(payload, tenantId);
    }

    if (payload.fecha_inicio) {
      payload.fecha_inicio = new Date(payload.fecha_inicio);
    }
    if (payload.fecha_fin) {
      payload.fecha_fin = new Date(payload.fecha_fin);
    }
    if (payload.coordenadas && typeof payload.coordenadas === 'string') {
      payload.coordenadas = JSON.parse(payload.coordenadas);
    }

    return this.prisma.evento.update({
      where: { id: evento.id },
      data: payload,
    });
  }

  async registrarAsistencia(eventoId: string, data: any, tenantId: string) {
    const evento = await this.findOne(eventoId, tenantId);

    if (!data.votante_id) {
      throw new BadRequestException('Se requiere votante_id');
    }

    // Verificar que el votante pertenece al tenant
    const votante = await this.prisma.votante.findFirst({
      where: { id: data.votante_id, tenant_id: tenantId, activo: true },
    });
    if (!votante) {
      throw new BadRequestException('Votante no encontrado');
    }

    return this.prisma.asistencia.upsert({
      where: {
        evento_id_votante_id: {
          evento_id: evento.id,
          votante_id: data.votante_id,
        },
      },
      create: {
        evento_id: evento.id,
        votante_id: data.votante_id,
        registrado_por: data.registrado_por,
        metodo_registro: data.metodo_registro || 'manual',
        coordenadas: data.coordenadas,
      },
      update: {
        registrado_por: data.registrado_por,
        metodo_registro: data.metodo_registro || 'manual',
        coordenadas: data.coordenadas,
      },
      include: { votante: true },
    });
  }

  async eliminarAsistencia(eventoId: string, votanteId: string, tenantId: string) {
    await this.findOne(eventoId, tenantId);
    return this.prisma.asistencia.deleteMany({
      where: { evento_id: eventoId, votante_id: votanteId },
    });
  }

  private normalizarEvento(data: any, tenantId: string, userId?: string) {
    const payload: any = {
      tenant_id: tenantId,
      nombre: String(data.nombre || '').trim(),
      descripcion: data.descripcion ? String(data.descripcion).trim() : null,
      direccion: data.direccion ? String(data.direccion).trim() : null,
      fecha_inicio: new Date(data.fecha_inicio),
      qr_code: data.qr_code || this.generarQrCode(),
      status: data.status || 'programado',
      created_by: userId || null,
    };

    if (!payload.nombre) {
      throw new BadRequestException('El nombre del evento es requerido');
    }
    if (isNaN(payload.fecha_inicio.getTime())) {
      throw new BadRequestException('Fecha de inicio inválida');
    }

    if (data.fecha_fin) {
      payload.fecha_fin = new Date(data.fecha_fin);
    }
    if (data.coordenadas) {
      payload.coordenadas =
        typeof data.coordenadas === 'string' ? JSON.parse(data.coordenadas) : data.coordenadas;
    }
    if (data.asistentes_estimados) {
      payload.asistentes_estimados = parseInt(data.asistentes_estimados, 10);
    }

    // Campos para cruces informativos
    payload.tematica = data.tematica ? String(data.tematica).trim() : null;
    payload.zona_id = data.zona_id || null;
    payload.lider_id = data.lider_id || null;
    payload.generar_ficha = data.generar_ficha === true || data.generar_ficha === 'true';

    if (payload.generar_ficha) {
      payload.ficha_informativa =
        data.ficha_informativa || this.generarFichaInformativa(data, tenantId);
    } else {
      payload.ficha_informativa = data.ficha_informativa || null;
    }

    return payload;
  }

  private generarFichaInformativa(data: any, tenantId: string) {
    const fecha = data.fecha_inicio ? new Date(data.fecha_inicio).toLocaleString('es-MX') : 'Por definir';
    return `FICHA INFORMATIVA DEL EVENTO
=============================
Evento: ${data.nombre || 'Sin nombre'}
Fecha: ${fecha}
Dirección: ${data.direccion || 'Por definir'}
Temática: ${data.tematica || 'No especificada'}
Zona electoral: ${data.zona_id || 'No asignada'}
Líder principal: ${data.lider_id || 'No asignado'}
Asistentes estimados: ${data.asistentes_estimados || 'No definido'}

Esta ficha servirá para cruzar información posteriormente con votantes, apoyos y territorio.`;
  }

  private generarQrCode() {
    return `evt-${uuidv4().slice(0, 8)}`;
  }
}
