import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class LideresService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filtros?: {
      padres?: boolean;
      scoreMin?: number;
      zonaId?: string;
      sinCoordenadas?: boolean;
      limit?: number;
    },
  ) {
    const where: any = { tenant_id: tenantId, activo: true };
    if (filtros?.padres) where.lider_padre_id = null;
    if (filtros?.scoreMin != null) where.score = { gte: filtros.scoreMin };
    if (filtros?.zonaId) where.zonas = { some: { id: filtros.zonaId } };
    if (filtros?.sinCoordenadas === true) where.votante = { coordenadas: null };
    else if (filtros?.sinCoordenadas === false) where.votante = { coordenadas: { not: null } };

    const lideres = await this.prisma.lider.findMany({
      where,
      include: {
        votante: true,
        zonas: { select: { id: true, nombre: true, secciones: true, color: true } },
        _count: {
          select: { lideresHijos: true },
        },
      },
      orderBy: filtros?.limit != null ? { score: 'desc' } : { created_at: 'desc' },
      take: filtros?.limit,
    });

    return lideres.map(l => ({
      ...l,
      lideres_hijos_count: l._count.lideresHijos,
    }));
  }

  async findOne(id: string, tenantId: string) {
    const lider = await this.prisma.lider.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        votante: true,
        zonas: { select: { id: true, nombre: true, secciones: true, color: true, coordenadas: true } },
        lideresHijos: {
          where: { activo: true },
          include: { votante: true },
        },
        liderPadre: { include: { votante: true } },
        _count: {
          select: { lideresHijos: true },
        },
      },
    });

    if (!lider) {
      throw new NotFoundException('Líder no encontrado');
    }

    const lideresHijosIds = lider.lideresHijos.map(h => h.id);
    const seccionesLider = lider.zonas.flatMap(z => z.secciones || []);

    // Ejecutar conteos e históricos en paralelo para reducir tiempo de conexión
    const [votantesBajoRed, eventosCount, recorridos, apoyos] = await Promise.all([
      this.prisma.votante.count({
        where: {
          tenant_id: tenantId,
          activo: true,
          OR: [
            { lider: { id: { in: lideresHijosIds } } },
            { id: lider.votante_id },
          ],
        },
      }),
      this.prisma.evento.count({
        where: { tenant_id: tenantId, lider_id: id },
      }),
      this.prisma.recorrido.findMany({
        where: { tenant_id: tenantId },
        orderBy: { fecha: 'desc' },
        take: 15,
        include: { usuario: { select: { id: true, nombre: true } } },
      }),
      this.prisma.apoyo.findMany({
        where: {
          tenant_id: tenantId,
          votante: { seccion_electoral: { in: seccionesLider } },
        },
        orderBy: { fecha_entrega: 'desc' },
        take: 15,
        include: { votante: { select: { id: true, nombre: true, seccion_electoral: true } } },
      }),
    ]);

    return {
      ...lider,
      metricas: {
        votantes_bajo_red: votantesBajoRed,
        lideres_hijos_count: lider._count.lideresHijos,
        eventos_count: eventosCount,
        recorridos_count: recorridos.length,
        apoyos_count: apoyos.length,
        alcance_estimado: lider.alcance_estimado || 0,
        score: lider.score,
      },
      actividad: {
        recorridos: recorridos.map(r => ({
          id: r.id,
          usuario_id: r.usuario_id,
          usuario_nombre: r.usuario?.nombre,
          fecha: r.fecha,
          distancia_km: r.distancia_km,
          duracion_min: r.duracion_min,
          secciones: r.secciones,
        })),
        apoyos: apoyos.map(a => ({
          id: a.id,
          tipo_apoyo: a.tipo_apoyo,
          fecha_entrega: a.fecha_entrega,
          foto_url: a.foto_url,
          votante_nombre: a.votante?.nombre,
          seccion_electoral: a.votante?.seccion_electoral,
          coordenadas: a.coordenadas,
        })),
      },
    };
  }

  async create(data: any, tenantId?: string) {
    const payload: any = { ...data };
    if (tenantId) payload.tenant_id = tenantId;
    return this.prisma.lider.create({ data: payload });
  }

  async update(id: string, data: any) {
    return this.prisma.lider.update({
      where: { id },
      data,
      include: {
        votante: true,
        liderPadre: { include: { votante: { select: { nombre: true } } } },
        lideresHijos: { include: { votante: { select: { nombre: true, coordenadas: true } } } },
        zonas: { select: { id: true, nombre: true, secciones: true, color: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.lider.update({
      where: { id },
      data: { activo: false },
    });
  }

  async updateScore(id: string, score: number) {
    return this.prisma.lider.update({
      where: { id },
      data: { score },
    });
  }

  async geojsonInfluencia(tenantId: string, radioMetros: number) {
    const lideres = await this.prisma.lider.findMany({
      where: { tenant_id: tenantId, activo: true },
      include: {
        votante: true,
        zonas: { select: { id: true, nombre: true, secciones: true, color: true } },
      },
    });

    const puntoDesde = (c: any): [number, number] | null => {
      if (!c || typeof c.lng !== 'number' || typeof c.lat !== 'number') return null;
      return [c.lng, c.lat];
    };

    const features = lideres
      .map(l => ({ lider: l, coords: puntoDesde(l.votante?.coordenadas) }))
      .filter(item => item.coords)
      .map(({ lider: l, coords }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          id: l.id,
          nombre: l.votante.nombre,
          telefono: l.votante.telefono,
          seccion_electoral: l.votante.seccion_electoral,
          colonia: l.votante.colonia,
          alcance_estimado: l.alcance_estimado,
          score: l.score,
          votante_id: l.votante_id,
          radio_metros: radioMetros,
          zonas: l.zonas.map(z => ({ id: z.id, nombre: z.nombre, secciones: z.secciones, color: z.color })),
        },
      }));

    return {
      type: 'FeatureCollection',
      radio_metros: radioMetros,
      features,
    };
  }

  async getStats(tenantId: string) {
    const total = await this.prisma.lider.count({
      where: { tenant_id: tenantId, activo: true },
    });

    const conCoordenadas = await this.prisma.lider.count({
      where: {
        tenant_id: tenantId,
        activo: true,
        votante: { coordenadas: { not: null } },
      },
    });

    const sinZona = await this.prisma.lider.count({
      where: {
        tenant_id: tenantId,
        activo: true,
        zonas: { none: {} },
      },
    });

    return {
      total,
      con_coordenadas: conCoordenadas,
      sin_zona: sinZona,
      cobertura_pct: total > 0 ? Math.round((conCoordenadas / total) * 100) : 0,
    };
  }
}
