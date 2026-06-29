import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class ProyeccionService {
  constructor(private prisma: PrismaService) {}

  async findMetas(query: any, tenantId: string) {
    const where: any = { tenant_id: tenantId };
    if (query.seccion) where.seccion = String(query.seccion);
    if (query.zona_id) where.zona_id = String(query.zona_id);
    if (query.proceso) where.proceso = String(query.proceso);
    return this.prisma.metaVotacion.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { zona: { select: { id: true, nombre: true } } },
    });
  }

  async createMeta(data: any, tenantId: string) {
    const proceso = String(data.proceso || '').trim() || String(new Date().getFullYear());
    const seccion = data.seccion ? String(data.seccion).trim() : null;
    const zona_id = data.zona_id || null;
    const meta_votos = data.meta_votos ? parseInt(data.meta_votos, 10) : 0;
    if (!seccion && !zona_id) throw new BadRequestException('Defina sección o zona');
    if (meta_votos <= 0) throw new BadRequestException('Meta de votos inválida');
    return this.prisma.metaVotacion.create({
      data: {
        tenant_id: tenantId,
        proceso,
        seccion,
        zona_id,
        meta_votos,
        meta_lista_nominal: data.meta_lista_nominal ? parseInt(data.meta_lista_nominal, 10) : null,
        meta_participacion: data.meta_participacion ? parseFloat(data.meta_participacion) : null,
      },
      include: { zona: { select: { id: true, nombre: true } } },
    });
  }

  async updateMeta(id: string, data: any, tenantId: string) {
    const meta = await this.prisma.metaVotacion.findFirst({ where: { id, tenant_id: tenantId } });
    if (!meta) throw new NotFoundException('Meta no encontrada');
    const payload: any = {};
    if (data.meta_votos !== undefined) {
      const v = parseInt(data.meta_votos, 10);
      if (v <= 0) throw new BadRequestException('Meta de votos inválida');
      payload.meta_votos = v;
    }
    if (data.meta_lista_nominal !== undefined) payload.meta_lista_nominal = data.meta_lista_nominal ? parseInt(data.meta_lista_nominal, 10) : null;
    if (data.meta_participacion !== undefined) payload.meta_participacion = data.meta_participacion ? parseFloat(data.meta_participacion) : null;
    return this.prisma.metaVotacion.update({ where: { id: meta.id }, data: payload });
  }

  async removeMeta(id: string, tenantId: string) {
    const meta = await this.prisma.metaVotacion.findFirst({ where: { id, tenant_id: tenantId } });
    if (!meta) throw new NotFoundException('Meta no encontrada');
    await this.prisma.metaVotacion.delete({ where: { id: meta.id } });
    return { ok: true };
  }

  async resumen(tenantId: string) {
    const [totalVotantes, totalApoyos, totalLideres, totalMetas] = await Promise.all([
      this.prisma.votante.count({ where: { tenant_id: tenantId, activo: true } }),
      this.prisma.apoyo.count({ where: { tenant_id: tenantId } }),
      this.prisma.lider.count({ where: { tenant_id: tenantId, activo: true } }),
      this.prisma.metaVotacion.aggregate({ where: { tenant_id: tenantId }, _sum: { meta_votos: true } }),
    ]);
    const metaTotal = totalMetas._sum.meta_votos || 0;
    return {
      votantes_registrados: totalVotantes,
      apoyos_registrados: totalApoyos,
      lideres_registrados: totalLideres,
      meta_votos_total: metaTotal,
      brecha: metaTotal - totalVotantes,
    };
  }

  async porSeccion(tenantId: string) {
    const seccionesRaw = await this.prisma.votante.groupBy({
      by: ['seccion_electoral'],
      where: { tenant_id: tenantId, activo: true },
      _count: { id: true },
    });
    const lideresRaw = await this.prisma.lider.findMany({
      where: { tenant_id: tenantId, activo: true },
      include: { votante: { select: { seccion_electoral: true } } },
    });
    const metasRaw = await this.prisma.metaVotacion.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: { zona: { select: { id: true, nombre: true } } },
    });
    const historicoRaw = await this.prisma.resultadoHistorico.findMany({
      where: { tenant_id: tenantId },
      orderBy: { anio: 'desc' },
    });

    const porSeccion = new Map<string, any>();

    // Filas base por sección electoral (votantes reales)
    seccionesRaw.forEach((s) => {
      const sec = s.seccion_electoral || 'Sin sección';
      porSeccion.set(sec, {
        seccion: sec,
        votantes: s._count.id,
        apoyos: 0,
        lideres: 0,
        lista_nominal_2024: undefined,
        meta_votos: undefined,
        votos_estimados: Math.round(s._count.id * 0.7), // heurística inicial
        tendencia: 'sin_datos',
      });
    });

    lideresRaw.forEach((l) => {
      const sec = l.votante?.seccion_electoral || 'Sin sección';
      const r = porSeccion.get(sec) || {
        seccion: sec,
        votantes: 0,
        apoyos: 0,
        lideres: 0,
        lista_nominal_2024: undefined,
        meta_votos: undefined,
        votos_estimados: 0,
        tendencia: 'sin_datos',
      };
      r.lideres += 1;
      porSeccion.set(sec, r);
    });

    // Aplicar metas por sección o por zona sindical
    metasRaw.forEach((m) => {
      const key = m.seccion || (m.zona?.nombre ?? null);
      if (!key) return;

      if (!porSeccion.has(key)) {
        porSeccion.set(key, {
          seccion: key,
          votantes: 0,
          apoyos: 0,
          lideres: 0,
          lista_nominal_2024: undefined,
          meta_votos: undefined,
          votos_estimados: 0,
          tendencia: 'sin_datos',
        });
      }
      const r = porSeccion.get(key);
      r.meta_votos = m.meta_votos;
      r.lista_nominal_2024 = m.meta_lista_nominal;
      r.votos_estimados = Math.round(r.votantes * 0.7 + r.lideres * 10 + r.apoyos * 0.5);
      r.faltan_para_ganar = Math.max(0, m.meta_votos - r.votos_estimados);
    });

    historicoRaw.forEach((h) => {
      if (porSeccion.has(h.seccion)) {
        const r = porSeccion.get(h.seccion);
        r.participacion_historica = h.participacion_pct;
        if (h.participacion_pct) {
          r.votos_estimados = Math.round(r.votantes * (h.participacion_pct / 100));
        }
      }
    });

    // Calcular tendencia final
    porSeccion.forEach((r) => {
      if (r.meta_votos && r.meta_votos > 0) {
        const ratio = r.votos_estimados / r.meta_votos;
        if (ratio >= 0.95) r.tendencia = 'arriba';
        else if (ratio >= 0.75) r.tendencia = 'peleado';
        else r.tendencia = 'abajo';
      }
    });

    return Array.from(porSeccion.values()).sort((a, b) => a.seccion.localeCompare(b.seccion, undefined, { numeric: true }));
  }
}
