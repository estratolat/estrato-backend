import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class FichasSeccionalesService {
  constructor(private prisma: PrismaService) {}

  async secciones(tenantId: string) {
    const raw = await this.prisma.votante.groupBy({
      by: ['seccion_electoral'],
      where: { tenant_id: tenantId, activo: true },
      _count: { id: true },
    });
    const ordenadas = raw
      .map((r) => r.seccion_electoral || 'Sin sección')
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return [...new Set(ordenadas)];
  }

  async ficha(seccion: string, tenantId: string) {
    const [votantes, lideres, apoyos, eventos, mensajes, casillas, metas, resultados, seccionIne] = await Promise.all([
      this.prisma.votante.count({ where: { tenant_id: tenantId, seccion_electoral: seccion, activo: true } }),
      this.prisma.lider.count({
        where: {
          tenant_id: tenantId,
          activo: true,
          votante: { seccion_electoral: seccion },
        },
      }),
      this.prisma.apoyo.count({
        where: {
          tenant_id: tenantId,
          votante: { seccion_electoral: seccion },
        },
      }),
      this.prisma.evento.count({ where: { tenant_id: tenantId, zona: { secciones: { has: seccion } } } }),
      this.prisma.mensaje.count({
        where: {
          tenant_id: tenantId,
          votante: { seccion_electoral: seccion },
        },
      }),
      this.prisma.casilla.findMany({
        where: { tenant_id: tenantId, seccion },
        orderBy: { tipo: 'asc' },
        include: { responsable: { select: { id: true, nombre: true } } },
      }),
      this.prisma.metaVotacion.findMany({
        where: { tenant_id: tenantId, seccion },
        orderBy: { created_at: 'desc' },
        include: { zona: { select: { id: true, nombre: true } } },
      }),
      this.prisma.resultadoHistorico.findMany({
        where: { tenant_id: tenantId, seccion },
        orderBy: { anio: 'desc' },
      }),
      this.prisma.seccionINE.findFirst({
        where: { tenant_id: tenantId, seccion },
        select: { lista_nominal_2024: true, padron_2024: true, municipio: true, estado: true },
      }),
    ]);

    const listaNominal = seccionIne?.lista_nominal_2024 || seccionIne?.padron_2024 || undefined;
    const meta = metas[0];
    const votosEstimados = Math.round(votantes * 0.7 + lideres * 10);
    const faltan = meta ? Math.max(0, meta.meta_votos - votosEstimados) : undefined;
    const tendencia = meta
      ? votosEstimados / meta.meta_votos >= 0.95
        ? 'arriba'
        : votosEstimados / meta.meta_votos >= 0.75
        ? 'peleado'
        : 'abajo'
      : 'sin_datos';

    return {
      seccion,
      votantes,
      lideres,
      apoyos,
      eventos,
      mensajes,
      casillas,
      metas,
      resultados: resultados.map((r) => ({
        anio: r.anio,
        partido_ganador: r.partido_ganador,
        votos_ganador: r.votos_ganador,
        votos_totales: r.votos_totales,
        participacion_pct: r.participacion_pct,
      })),
      lista_nominal_2024: listaNominal,
      proyeccion: {
        seccion,
        votantes,
        apoyos,
        lideres,
        lista_nominal_2024: listaNominal,
        meta_votos: meta?.meta_votos,
        votos_estimados: votosEstimados,
        faltan_para_ganar: faltan,
        tendencia,
      },
    };
  }

  async comparativa(secciones: string[], tenantId: string) {
    if (!Array.isArray(secciones) || secciones.length === 0) throw new NotFoundException('Secciones requeridas');
    return Promise.all(secciones.map((s) => this.ficha(s, tenantId)));
  }
}
