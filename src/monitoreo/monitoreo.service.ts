import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class MonitoreoService {
  constructor(private prisma: PrismaService) {}

  async resumen(tenantId: string) {
    const [total, sinReportar, abiertas, cerradas, incidencias, esperados] = await Promise.all([
      this.prisma.casilla.count({ where: { tenant_id: tenantId } }),
      this.prisma.casilla.count({ where: { tenant_id: tenantId, status: 'sin_reportar' } }),
      this.prisma.casilla.count({ where: { tenant_id: tenantId, status: 'abierta' } }),
      this.prisma.casilla.count({ where: { tenant_id: tenantId, status: 'cerrada' } }),
      this.prisma.casilla.count({ where: { tenant_id: tenantId, status: 'incidencia' } }),
      this.prisma.casilla.aggregate({ where: { tenant_id: tenantId }, _sum: { electores_esperados: true } }),
    ]);
    return {
      total_casillas: total,
      sin_reportar: sinReportar,
      abiertas,
      cerradas,
      incidencias,
      votantes_esperados: esperados._sum.electores_esperados || 0,
      cobertura_pct: total ? Math.round((cerradas / total) * 100) : 0,
    };
  }

  async porSeccion(tenantId: string) {
    const casillas = await this.prisma.casilla.findMany({
      where: { tenant_id: tenantId },
      orderBy: { seccion: 'asc' },
    });
    const agrupado: Record<string, { seccion: string; total: number; abiertas: number; cerradas: number; incidencias: number; sin_reportar: number; esperados: number }> = {};
    casillas.forEach((c) => {
      if (!agrupado[c.seccion]) {
        agrupado[c.seccion] = { seccion: c.seccion, total: 0, abiertas: 0, cerradas: 0, incidencias: 0, sin_reportar: 0, esperados: 0 };
      }
      agrupado[c.seccion].total += 1;
      agrupado[c.seccion].esperados += c.electores_esperados || 0;
      if (c.status === 'abierta') agrupado[c.seccion].abiertas += 1;
      if (c.status === 'cerrada') agrupado[c.seccion].cerradas += 1;
      if (c.status === 'incidencia') agrupado[c.seccion].incidencias += 1;
      if (c.status === 'sin_reportar') agrupado[c.seccion].sin_reportar += 1;
    });
    return Object.values(agrupado);
  }

  async casillas(query: any, tenantId: string) {
    const where: any = { tenant_id: tenantId };
    if (query.seccion) where.seccion = String(query.seccion);
    if (query.status) where.status = String(query.status);
    return this.prisma.casilla.findMany({
      where,
      orderBy: { seccion: 'asc' },
      take: query.limit ? parseInt(query.limit, 10) : 500,
      include: { responsable: { select: { id: true, nombre: true } } },
    });
  }

  async incidencias(tenantId: string) {
    return this.prisma.casilla.findMany({
      where: { tenant_id: tenantId, status: 'incidencia' },
      orderBy: { created_at: 'desc' },
      include: { responsable: { select: { id: true, nombre: true } } },
    });
  }
}
