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
      const q = String(query.q).trim();
      where.OR = [
        { seccion: { contains: q, mode: 'insensitive' } },
        { numero: { contains: q, mode: 'insensitive' } },
        { ubicacion: { contains: q, mode: 'insensitive' } },
        { direccion: { contains: q, mode: 'insensitive' } },
        { referencia: { contains: q, mode: 'insensitive' } },
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

  /**
   * Trae los resultados históricos electorales vinculados a la sección de una casilla.
   * Agrupa por año + tipo de elección para mostrar votos por casilla histórica.
   */
  async resultadosHistoricos(id: string, tenantId: string) {
    const casilla = await this.findOne(id, tenantId);
    if (!casilla) throw new NotFoundException('Casilla no encontrada');

    const resultados = await this.prisma.resultadoHistorico.findMany({
      where: {
        tenant_id: tenantId,
        seccion: casilla.seccion,
      },
      orderBy: [
        { anio: 'desc' },
        { tipo_eleccion: 'asc' },
        { tipo_casilla: 'asc' },
        { casilla: 'asc' },
        { ext_contigua: 'asc' },
      ],
    });

    const mapTipo = (tipoCasilla?: string | null) => {
      switch (tipoCasilla) {
        case 'B': return 'Básica';
        case 'C': return 'Contigua';
        case 'E': return 'Especial';
        case 'A': return 'Alterna';
        case 'S': return 'Supervisora';
        default: return tipoCasilla || 'General';
      }
    };

    const eleccionesMap = new Map<string, any>();
    for (const r of resultados) {
      const key = `${r.anio}|${r.tipo_eleccion}`;
      if (!eleccionesMap.has(key)) {
        eleccionesMap.set(key, {
          anio: r.anio,
          tipo_eleccion: r.tipo_eleccion,
          casillas: [],
          totales: {
            lista_nominal: 0,
            total_votos: 0,
            votos_validos: 0,
            votos_nulos: 0,
            votos_no_reg: 0,
          },
          max_votos: 0,
          ganador: null as any,
        });
      }
      const elec = eleccionesMap.get(key);

      const desglose = (r.desglose_partidos || []) as { partido: string; votos: number; tipo: string }[];
      const item = {
        casilla: r.casilla,
        tipo_casilla: r.tipo_casilla,
        tipo_casilla_label: mapTipo(r.tipo_casilla),
        ext_contigua: r.ext_contigua,
        lista_nominal: r.lista_nominal,
        total_votos: r.total_votos,
        votos_validos: r.votos_validos,
        votos_nulos: r.votos_nulos,
        votos_no_reg: r.votos_no_reg,
        participacion_pct: r.participacion_pct,
        partido_ganador: r.partido_ganador,
        votos_ganador: r.votos_ganador,
        desglose_partidos: desglose,
      };
      elec.casillas.push(item);

      elec.totales.lista_nominal += r.lista_nominal || 0;
      elec.totales.total_votos += r.total_votos || 0;
      elec.totales.votos_validos += r.votos_validos || 0;
      elec.totales.votos_nulos += r.votos_nulos || 0;
      elec.totales.votos_no_reg += r.votos_no_reg || 0;

      // Ganador por suma de desglose para toda la sección en esa elección
      for (const d of desglose) {
        const actual = elec.ganador?.partido === d.partido ? elec.ganador.votos : 0;
        const suma = actual + (d.votos || 0);
        if (suma > elec.max_votos) {
          elec.max_votos = suma;
          elec.ganador = { partido: d.partido, votos: suma, tipo: d.tipo };
        }
      }
    }

    const elecciones = Array.from(eleccionesMap.values()).map((e) => ({
      anio: e.anio,
      tipo_eleccion: e.tipo_eleccion,
      casillas: e.casillas,
      totales: e.totales,
      ganador: e.ganador,
    }));

    return {
      casilla: {
        id: casilla.id,
        seccion: casilla.seccion,
        tipo: casilla.tipo,
        numero: casilla.numero,
        ubicacion: casilla.ubicacion,
      },
      total_resultados: resultados.length,
      elecciones,
    };
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
