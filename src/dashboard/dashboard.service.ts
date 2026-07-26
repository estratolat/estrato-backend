import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { VotantesService } from '../votantes/votantes.service';
import { CrmService } from '../crm/crm.service';
import { EventosService } from '../eventos/eventos.service';
import { ApoyosService } from '../apoyos/apoyos.service';
import { LlamadasService } from '../llamadas/llamadas.service';
import { ProyeccionService } from '../proyeccion/proyeccion.service';
import { MapasService } from '../mapas/mapas.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private votantesService: VotantesService,
    private crmService: CrmService,
    private eventosService: EventosService,
    private apoyosService: ApoyosService,
    private llamadasService: LlamadasService,
    private proyeccionService: ProyeccionService,
    private mapasService: MapasService,
  ) {}

  async resumen(tenantId: string) {
    const ahora = new Date();
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - ahora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const [
      votantesStats,
      mensajesStats,
      eventosTotal,
      eventosProximos,
      apoyosTotal,
      apoyosMes,
      llamadasResumen,
      territorio,
      proyeccion,
      actividadReciente,
    ] = await Promise.all([
      this.safe(() => this.votantesService.getStats(tenantId), { total: 0, nuevosHoy: 0, niveles: {} }, 'votantes'),
      this.safe(() => this.crmService.getStats(tenantId), { total: 0, pendientes: 0, porCanal: [] } as any, 'mensajes'),
      this.safe(() => this.prisma.evento.count({ where: { tenant_id: tenantId } }), 0, 'eventos.total'),
      this.safe(() => this.prisma.evento.count({
        where: {
          tenant_id: tenantId,
          fecha_inicio: { gte: ahora },
          status: { in: ['programado', 'en_curso'] },
        },
      }), 0, 'eventos.proximos'),
      this.safe(() => this.prisma.apoyo.count({ where: { tenant_id: tenantId } }), 0, 'apoyos.total'),
      this.safe(() => this.prisma.apoyo.count({
        where: {
          tenant_id: tenantId,
          fecha_entrega: { gte: inicioMes },
        },
      }), 0, 'apoyos.mes'),
      this.safe(() => this.resumenLlamadas(tenantId), { total: 0, contestadas: 0, porcentaje: 0, campanas: 0 }, 'llamadas'),
      this.safe(() => this.resumenTerritorio(tenantId), { secciones_cargadas: 0, secciones_total: 0, porcentaje: 0 }, 'territorio'),
      this.safe(() => this.proyeccionService.resumen(tenantId), { votantes_registrados: 0, votantes_capturados: 0, apoyos_registrados: 0, lideres_registrados: 0, meta_votos_total: 0, meta_participacion: 0, meta_lista_nominal: 0, brecha: 0, avance_padron: 0 } as any, 'proyeccion'),
      this.safe(() => this.actividadReciente(tenantId), [], 'actividad_reciente'),
    ]);

    const votantesNuevosSemana = await this.safe(() => this.prisma.votante.count({
      where: {
        tenant_id: tenantId,
        activo: true,
        created_at: { gte: inicioSemana },
      },
    }), 0, 'votantes.nuevosSemana');

    const metaVotos = proyeccion.meta_votos_total || 0;
    const votantesCapturados = votantesStats.total || 0;
    const padronMeta = (proyeccion as any).votantes_registrados || votantesCapturados || 1;
    const avance = metaVotos > 0
      ? Math.min(100, Math.round((votantesCapturados / metaVotos) * 1000) / 10)
      : Math.min(100, Math.round((votantesCapturados / padronMeta) * 1000) / 10);

    const semaforo = this.calcularSemaforo(avance, {
      avanceTerritorio: territorio.porcentaje,
      apoyos: apoyosTotal,
      votantes: votantesCapturados,
    });

    return {
      votantes: {
        total: votantesStats.total,
        nuevosHoy: votantesStats.nuevosHoy,
        nuevosSemana: votantesNuevosSemana,
        meta: metaVotos,
        padron: padronMeta,
        avance_pct: avance,
        niveles_apoyo: votantesStats.niveles,
      },
      mensajes: {
        total: mensajesStats.total,
        pendientes: mensajesStats.pendientes,
      },
      eventos: {
        total: eventosTotal,
        proximos: eventosProximos,
      },
      apoyos: {
        total: apoyosTotal,
        mes: apoyosMes,
      },
      llamadas: llamadasResumen,
      territorio,
      proyeccion: {
        meta_votos_total: proyeccion.meta_votos_total,
        meta_lista_nominal: proyeccion.meta_lista_nominal,
        meta_participacion: proyeccion.meta_participacion,
        votantes_capturados: proyeccion.votantes_capturados,
        brecha: proyeccion.brecha,
      },
      semaforo,
      actividad_reciente: actividadReciente,
    };
  }

  private async resumenLlamadas(tenantId: string) {
    const campanas = await this.llamadasService.findAll(tenantId);
    const ids = campanas.map((c: any) => c.id);

    if (ids.length === 0) {
      return { total: 0, contestadas: 0, porcentaje: 0, campanas: 0 };
    }

    const [total, contestadas] = await Promise.all([
      this.prisma.llamadaVapi.count({
        where: { tenant_id: tenantId, campana_id: { in: ids } },
      }),
      this.prisma.llamadaVapi.count({
        where: {
          tenant_id: tenantId,
          campana_id: { in: ids },
          status: { in: ['contestada', 'completada'] },
        },
      }),
    ]);

    const porcentaje = total > 0 ? Math.round((contestadas / total) * 1000) / 10 : 0;

    return {
      total,
      contestadas,
      porcentaje,
      campanas: campanas.length,
    };
  }

  private async resumenTerritorio(tenantId: string) {
    const [seccionesTotal, seccionesConVotantes] = await Promise.all([
      this.prisma.seccionINE.count({ where: { tenant_id: tenantId } }),
      this.prisma.votante.groupBy({
        by: ['seccion_electoral'],
        where: {
          tenant_id: tenantId,
          activo: true,
          seccion_electoral: { not: null },
        },
        _count: { id: true },
      }),
    ]);

    const seccionesCargadas = seccionesConVotantes.length;
    const porcentaje = seccionesTotal > 0
      ? Math.round((seccionesCargadas / seccionesTotal) * 1000) / 10
      : 0;

    return {
      secciones_cargadas: seccionesCargadas,
      secciones_total: seccionesTotal,
      porcentaje,
    };
  }

  private async actividadReciente(tenantId: string) {
    const take = 8;
    const [
      votantes,
      mensajes,
      apoyos,
      eventos,
    ] = await Promise.all([
      this.prisma.votante.findMany({
        where: { tenant_id: tenantId, activo: true },
        orderBy: { created_at: 'desc' },
        take,
        select: { id: true, nombre: true, seccion_electoral: true, created_at: true },
      }),
      this.prisma.mensaje.findMany({
        where: { tenant_id: tenantId, direccion: 'inbound' },
        orderBy: { created_at: 'desc' },
        take,
        select: { id: true, contenido: true, canal: true, created_at: true, votante: { select: { nombre: true } } },
      }),
      this.prisma.apoyo.findMany({
        where: { tenant_id: tenantId },
        orderBy: { fecha_entrega: 'desc' },
        take,
        include: { votante: { select: { nombre: true, seccion_electoral: true } } },
      }),
      this.prisma.evento.findMany({
        where: { tenant_id: tenantId },
        orderBy: { fecha_inicio: 'desc' },
        take,
        select: { id: true, nombre: true, fecha_inicio: true, asistentes_estimados: true },
      }),
    ]);

    const items = [
      ...votantes.map((v) => ({
        tipo: 'votante',
        mensaje: `Nuevo simpatizante registrado`,
        detalle: `${v.nombre || 'Sin nombre'}${v.seccion_electoral ? ` - Sección ${v.seccion_electoral}` : ''}`,
        time: v.created_at,
      })),
      ...mensajes.map((m) => ({
        tipo: 'mensaje',
        mensaje: `Nuevo mensaje de ${this.labelCanal(m.canal)}`,
        detalle: this.truncar(m.contenido, 40) || 'Sin contenido',
        time: m.created_at,
      })),
      ...apoyos.map((a) => ({
        tipo: 'apoyo',
        mensaje: `Apoyo entregado`,
        detalle: `${a.tipo_apoyo}${a.votante?.seccion_electoral ? ` - Sección ${a.votante.seccion_electoral}` : ''}`,
        time: a.fecha_entrega,
      })),
      ...eventos.map((e) => ({
        tipo: 'evento',
        mensaje: `Evento ${e.fecha_inicio > new Date() ? 'programado' : 'realizado'}`,
        detalle: `${e.nombre}${e.asistentes_estimados ? ` - ~${e.asistentes_estimados} asistentes` : ''}`,
        time: e.fecha_inicio,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, take)
      .map((item) => ({
        ...item,
        time: this.tiempoRelativo(new Date(item.time)),
      }));

    return items;
  }

  private async safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`[DashboardService] Error en ${label}:`, error?.message || error);
      return fallback;
    }
  }

  private calcularSemaforo(
    avance: number,
    detalles: { avanceTerritorio: number; apoyos: number; votantes: number },
  ) {
    const { avanceTerritorio } = detalles;

    let color: 'verde' | 'amarillo' | 'rojo';
    let label: string;

    if (avance >= 80 && avanceTerritorio >= 60) {
      color = 'verde';
      label = 'Avance sólido';
    } else if (avance >= 50 || avanceTerritorio >= 40) {
      color = 'amarillo';
      label = 'Avance moderado';
    } else {
      color = 'rojo';
      label = 'Avance bajo';
    }

    return {
      color,
      label,
      avance_pct: avance,
      avance_territorio_pct: avanceTerritorio,
      recomendacion: this.recomendacionSemaforo(color, avance, avanceTerritorio),
    };
  }

  private recomendacionSemaforo(
    color: 'verde' | 'amarillo' | 'rojo',
    avance: number,
    avanceTerritorio: number,
  ) {
    if (color === 'verde') {
      return avanceTerritorio < 80
        ? 'Buena captación. Refuerza cobertura territorial en secciones faltantes.'
        : 'Excelente ritmo. Mantén la frecuencia de contacto y activa a líderes.';
    }
    if (color === 'amarillo') {
      if (avance < 50) return 'Falta captación de simpatizantes. Intensifica brigadas y contactos.';
      return 'Cobertura territorial insuficiente. Enfócate en secciones sin datos.';
    }
    return 'Urgente: se requiere acelerar captación de votantes y ampliar territorio.';
  }

  private labelCanal(canal: string) {
    const map: Record<string, string> = {
      whatsapp: 'WhatsApp',
      messenger: 'Messenger',
      sms: 'SMS',
      email: 'Email',
      form: 'Formulario',
    };
    return map[canal] || canal;
  }

  private truncar(texto: string, max: number) {
    if (!texto) return '';
    return texto.length > max ? texto.slice(0, max) + '…' : texto;
  }

  private tiempoRelativo(fecha: Date) {
    const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
    if (segundos < 60) return 'ahora';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas} h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `${dias} d`;
    return `${Math.floor(dias / 7)} sem`;
  }
}
