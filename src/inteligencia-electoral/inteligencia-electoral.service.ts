import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../common/services/prisma.service';
import { AnthropicService } from '../common/services/anthropic.service';
import { CrearPartidoDto, ActualizarPartidoDto } from './dto/crear-partido.dto';
import { CrearEleccionDto, ActualizarEleccionDto } from './dto/crear-eleccion.dto';
import { CrearActorDto, ActualizarActorDto } from './dto/crear-actor.dto';

@Injectable()
export class InteligenciaElectoralService {
  constructor(
    private prisma: PrismaService,
    private anthropic: AnthropicService,
  ) {}

  // =====================
  // PARTIDOS
  // =====================
  async findAllPartidos(tenantId: string) {
    return this.prisma.partido.findMany({
      where: { tenant_id: tenantId },
      orderBy: { orden: 'asc' },
    });
  }

  async createPartido(tenantId: string, dto: CrearPartidoDto) {
    const siglas = dto.siglas.trim().toUpperCase();
    const existe = await this.prisma.partido.findUnique({
      where: { tenant_id_siglas: { tenant_id: tenantId, siglas } },
    });
    if (existe) throw new ConflictException(`Ya existe un partido con siglas ${siglas}`);

    return this.prisma.partido.create({
      data: {
        tenant_id: tenantId,
        nombre: dto.nombre.trim(),
        siglas,
        color_hex: dto.color_hex,
        logo_url: dto.logo_url,
        orden: dto.orden ?? 0,
      },
    });
  }

  async updatePartido(tenantId: string, id: string, dto: ActualizarPartidoDto) {
    const partido = await this.prisma.partido.findFirst({ where: { id, tenant_id: tenantId } });
    if (!partido) throw new NotFoundException('Partido no encontrado');

    if (dto.siglas) {
      const siglas = dto.siglas.trim().toUpperCase();
      const existe = await this.prisma.partido.findUnique({
        where: { tenant_id_siglas: { tenant_id: tenantId, siglas } },
      });
      if (existe && existe.id !== id) {
        throw new ConflictException(`Ya existe otro partido con siglas ${siglas}`);
      }
      dto.siglas = siglas;
    }

    return this.prisma.partido.update({
      where: { id },
      data: {
        nombre: dto.nombre?.trim(),
        siglas: dto.siglas,
        color_hex: dto.color_hex,
        logo_url: dto.logo_url,
        orden: dto.orden,
      },
    });
  }

  async deletePartido(tenantId: string, id: string) {
    const partido = await this.prisma.partido.findFirst({ where: { id, tenant_id: tenantId } });
    if (!partido) throw new NotFoundException('Partido no encontrado');

    await this.prisma.partido.delete({ where: { id } });
    return { ok: true, mensaje: 'Partido eliminado' };
  }

  // =====================
  // ELECCIONES
  // =====================
  async findAllElecciones(tenantId: string, soloActivas?: boolean) {
    return this.prisma.eleccion.findMany({
      where: {
        tenant_id: tenantId,
        ...(soloActivas ? { activa: true } : {}),
      },
      orderBy: [{ anio: 'desc' }, { created_at: 'desc' }],
      include: {
        _count: { select: { actores: true, resultados: true, proyecciones: true } },
      },
    });
  }

  async findOneEleccion(tenantId: string, id: string) {
    const eleccion = await this.prisma.eleccion.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        actores: {
          orderBy: { orden: 'asc' },
          include: { partido: { select: { id: true, siglas: true, nombre: true, color_hex: true } } },
        },
        _count: { select: { resultados: true, proyecciones: true } },
      },
    });
    if (!eleccion) throw new NotFoundException('Elección no encontrada');
    return eleccion;
  }

  async createEleccion(tenantId: string, dto: CrearEleccionDto) {
    return this.prisma.eleccion.create({
      data: {
        tenant_id: tenantId,
        nombre: dto.nombre.trim(),
        anio: dto.anio,
        puesto: dto.puesto.trim(),
        descripcion: dto.descripcion?.trim(),
        activa: dto.activa ?? true,
      },
    });
  }

  async updateEleccion(tenantId: string, id: string, dto: ActualizarEleccionDto) {
    const eleccion = await this.prisma.eleccion.findFirst({ where: { id, tenant_id: tenantId } });
    if (!eleccion) throw new NotFoundException('Elección no encontrada');

    return this.prisma.eleccion.update({
      where: { id },
      data: {
        nombre: dto.nombre?.trim(),
        anio: dto.anio,
        puesto: dto.puesto?.trim(),
        descripcion: dto.descripcion?.trim(),
        activa: dto.activa,
      },
    });
  }

  async deleteEleccion(tenantId: string, id: string) {
    const eleccion = await this.prisma.eleccion.findFirst({ where: { id, tenant_id: tenantId } });
    if (!eleccion) throw new NotFoundException('Elección no encontrada');

    await this.prisma.eleccion.delete({ where: { id } });
    return { ok: true, mensaje: 'Elección eliminada' };
  }

  // =====================
  // ACTORES / COALICIONES
  // =====================
  async findActoresByEleccion(tenantId: string, eleccionId: string) {
    await this.findOneEleccion(tenantId, eleccionId);

    return this.prisma.eleccionActor.findMany({
      where: { eleccion_id: eleccionId },
      orderBy: { orden: 'asc' },
      include: { partido: { select: { id: true, siglas: true, nombre: true, color_hex: true } } },
    });
  }

  async createActor(tenantId: string, eleccionId: string, dto: CrearActorDto) {
    await this.findOneEleccion(tenantId, eleccionId);

    const alias = dto.columna_excel_alias.trim();
    const existeAlias = await this.prisma.eleccionActor.findUnique({
      where: { eleccion_id_columna_excel_alias: { eleccion_id: eleccionId, columna_excel_alias: alias } },
    });
    if (existeAlias) throw new ConflictException(`El alias de columna ${alias} ya existe en esta elección`);

    if (dto.partido_id) {
      const partido = await this.prisma.partido.findFirst({
        where: { id: dto.partido_id, tenant_id: tenantId },
      });
      if (!partido) throw new BadRequestException('El partido no existe en este tenant');
    }

    return this.prisma.eleccionActor.create({
      data: {
        tenant_id: tenantId,
        eleccion_id: eleccionId,
        partido_id: dto.partido_id || null,
        es_coalicion: dto.es_coalicion ?? false,
        nombre_coalicion: dto.nombre_coalicion?.trim() || null,
        nombre_visual: dto.nombre_visual.trim(),
        color_hex: dto.color_hex || null,
        columna_excel_alias: alias,
        orden: dto.orden ?? 0,
      },
      include: { partido: { select: { id: true, siglas: true, nombre: true, color_hex: true } } },
    });
  }

  async updateActor(tenantId: string, actorId: string, dto: ActualizarActorDto) {
    const actor = await this.prisma.eleccionActor.findFirst({
      where: { id: actorId, tenant_id: tenantId },
    });
    if (!actor) throw new NotFoundException('Actor no encontrado');

    if (dto.columna_excel_alias) {
      const alias = dto.columna_excel_alias.trim();
      const existeAlias = await this.prisma.eleccionActor.findUnique({
        where: { eleccion_id_columna_excel_alias: { eleccion_id: actor.eleccion_id, columna_excel_alias: alias } },
      });
      if (existeAlias && existeAlias.id !== actorId) {
        throw new ConflictException(`El alias de columna ${alias} ya existe en esta elección`);
      }
      dto.columna_excel_alias = alias;
    }

    if (dto.partido_id) {
      const partido = await this.prisma.partido.findFirst({
        where: { id: dto.partido_id, tenant_id: tenantId },
      });
      if (!partido) throw new BadRequestException('El partido no existe en este tenant');
    }

    return this.prisma.eleccionActor.update({
      where: { id: actorId },
      data: {
        partido_id: dto.partido_id === undefined ? undefined : dto.partido_id || null,
        es_coalicion: dto.es_coalicion,
        nombre_coalicion: dto.nombre_coalicion === undefined ? undefined : dto.nombre_coalicion?.trim() || null,
        nombre_visual: dto.nombre_visual?.trim(),
        color_hex: dto.color_hex,
        columna_excel_alias: dto.columna_excel_alias,
        orden: dto.orden,
      },
      include: { partido: { select: { id: true, siglas: true, nombre: true, color_hex: true } } },
    });
  }

  async deleteActor(tenantId: string, actorId: string) {
    const actor = await this.prisma.eleccionActor.findFirst({
      where: { id: actorId, tenant_id: tenantId },
    });
    if (!actor) throw new NotFoundException('Actor no encontrado');

    await this.prisma.eleccionActor.delete({ where: { id: actorId } });
    return { ok: true, mensaje: 'Actor eliminado' };
  }

  // =====================
  // PLANTILLA EXCEL
  // =====================
  async generarPlantilla(tenantId: string, eleccionId: string) {
    const eleccion = await this.findOneEleccion(tenantId, eleccionId);
    const actores = await this.findActoresByEleccion(tenantId, eleccionId);

    const columnasFijas = [
      'ID_ESTADO',
      'ID_MUNICIPIO',
      'MUNICIPIO',
      'SECCION',
      'CASILLA',
      'LISTA_NOMINAL',
    ];
    const columnasActores = actores.map((a) => a.columna_excel_alias);
    const columnasTotales = [
      'CAND_NO_REG',
      'VOTOS_NULOS',
      'TOTAL_VOTOS',
      'ESTATUS_ACTA',
      'OBSERVACIONES',
    ];

    const headers = [...columnasFijas, ...columnasActores, ...columnasTotales];

    // Fila de ejemplo
    const ejemplo: any[] = [];
    for (const h of headers) {
      if (['ID_ESTADO', 'ID_MUNICIPIO'].includes(h)) ejemplo.push('00');
      else if (h === 'SECCION') ejemplo.push('0000');
      else if (h === 'LISTA_NOMINAL' || h === 'TOTAL_VOTOS' || h === 'VOTOS_NULOS' || h === 'CAND_NO_REG') ejemplo.push(0);
      else if (columnasActores.includes(h)) ejemplo.push(0);
      else ejemplo.push('');
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ejemplo]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `plantilla_${eleccion.nombre.replace(/\s+/g, '_')}_${eleccion.anio}.xlsx`;

    return { buffer, filename };
  }

  // =====================
  // CARGA MASIVA EXCEL
  // =====================
  async cargarExcel(tenantId: string, eleccionId: string, archivo: Express.Multer.File) {
    if (!archivo) throw new BadRequestException('No se recibió archivo');

    const eleccion = await this.findOneEleccion(tenantId, eleccionId);
    const actores = await this.findActoresByEleccion(tenantId, eleccionId);
    const aliasMap = new Map(actores.map((a) => [a.columna_excel_alias.toUpperCase(), a.id]));

    const wb = XLSX.read(archivo.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (rows.length === 0) throw new BadRequestException('El archivo está vacío o no tiene datos');

    const errores: Array<{ fila: number; error: string; casilla?: string; seccion?: string }> = [];
    const paraInsertar: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fila = i + 2;

      const estadoId = this.normalizarTexto(row.ID_ESTADO || row['ID ESTADO'] || row.id_estado || row.estado_id);
      const municipioId = this.normalizarTexto(row.ID_MUNICIPIO || row['ID MUNICIPIO'] || row.id_municipio || row.municipio_id);
      const municipio = String(row.MUNICIPIO || row.municipio || '').trim();
      let seccion = this.normalizarSeccion(row.SECCION || row.seccion || row.Seccion || row['SECCION ']);
      const casilla = String(row.CASILLA || row.casilla || row.CASILL || '').trim();
      const listaNominal = this.numero(row.LISTA_NOMINAL || row['LISTA NOMINAL'] || row.lista_nominal || 0);

      if (!seccion) {
        errores.push({ fila, error: 'Falta SECCION' });
        continue;
      }

      const votosData: Record<string, number> = {};
      for (const [alias, actorId] of aliasMap.entries()) {
        const val = this.numero(row[alias] || row[alias.toUpperCase()] || row[alias.toLowerCase()] || 0);
        if (val > 0) votosData[actorId] = val;
      }

      const votosNoReg = this.numero(row.CAND_NO_REG || row['CAND NO REG'] || row.cand_no_reg || row.NUM_VOTOS_CAN_NREG || 0);
      const votosNulos = this.numero(row.VOTOS_NULOS || row['VOTOS NULOS'] || row.votos_nulos || row.NUM_VOTOS_NULOS || 0);
      const totalVotos = this.numero(row.TOTAL_VOTOS || row['TOTAL VOTOS'] || row.total_votos || 0);
      const estatusActa = String(row.ESTATUS_ACTA || row['ESTATUS ACTA'] || row.estatus_acta || '').trim() || null;
      const observaciones = String(row.OBSERVACIONES || row.observaciones || '').trim() || null;

      const sumaVotos = Object.values(votosData).reduce((a, b) => a + b, 0) + votosNoReg + votosNulos;
      if (sumaVotos !== totalVotos) {
        errores.push({
          fila,
          seccion,
          casilla,
          error: `Cuadre aritmético: suma actores(${Object.values(votosData).reduce((a, b) => a + b, 0)}) + no_reg(${votosNoReg}) + nulos(${votosNulos}) = ${sumaVotos}, total=${totalVotos}`,
        });
        continue;
      }

      paraInsertar.push({
        tenant_id: tenantId,
        eleccion_id: eleccionId,
        estado_id: estadoId || '0',
        municipio_id: municipioId || '0',
        municipio,
        seccion,
        casilla: casilla || `${i + 1}`,
        lista_nominal: listaNominal,
        votos_data: votosData,
        votos_no_registrados: votosNoReg,
        votos_nulos: votosNulos,
        total_votos: totalVotos,
        estatus_acta: estatusActa,
        observaciones,
      });
    }

    if (errores.length > 0 && paraInsertar.length === 0) {
      throw new BadRequestException({
        mensaje: `Error en carga: ${errores.length} filas con errores, 0 filas válidas`,
        errores,
      });
    }

    // Borrar resultados previos de la elección para reemplazo limpio
    await this.prisma.resultadoCasilla.deleteMany({ where: { eleccion_id: eleccionId, tenant_id: tenantId } });

    // Insertar en lotes de 500 para evitar límites de Vercel/Prisma
    const LOTE = 500;
    let insertados = 0;
    for (let i = 0; i < paraInsertar.length; i += LOTE) {
      const lote = paraInsertar.slice(i, i + LOTE);
      await this.prisma.resultadoCasilla.createMany({ data: lote, skipDuplicates: true });
      insertados += lote.length;
    }

    // Recalcular secciones
    await this.recalcularSecciones(tenantId, eleccionId);

    return {
      ok: true,
      eleccion: eleccion.nombre,
      filasLeidas: rows.length,
      insertados,
      errores: errores.length,
      detallesErrores: errores.slice(0, 50),
    };
  }

  private normalizarTexto(val: any): string {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  }

  private normalizarSeccion(val: any): string {
    const str = this.normalizarTexto(val);
    if (!str) return '';
    // Forzar ceros a la izquierda si es numérico
    const num = Number(str);
    if (!isNaN(num) && str !== '') {
      return String(num).padStart(4, '0');
    }
    return str;
  }

  private numero(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : Math.max(0, Math.floor(n));
  }

  // =====================
  // RECÁLCULO POR SECCIÓN
  // =====================
  async recalcularSecciones(tenantId: string, eleccionId: string) {
    // Traer todos los resultados de la elección
    const resultados = await this.prisma.resultadoCasilla.findMany({
      where: { tenant_id: tenantId, eleccion_id: eleccionId },
    });

    // Agrupar por sección
    const porSeccion = new Map<
      string,
      {
        lista_nominal: number;
        total_votos: number;
        votos_nulos: number;
        municipio: string;
        sumaPorActor: Map<string, number>;
        casillas: any[];
      }
    >();

    for (const r of resultados) {
      if (!porSeccion.has(r.seccion)) {
        porSeccion.set(r.seccion, {
          lista_nominal: 0,
          total_votos: 0,
          votos_nulos: 0,
          municipio: r.municipio,
          sumaPorActor: new Map<string, number>(),
          casillas: [],
        });
      }
      const ag = porSeccion.get(r.seccion)!;
      ag.lista_nominal += r.lista_nominal || 0;
      ag.total_votos += r.total_votos || 0;
      ag.votos_nulos += r.votos_nulos || 0;
      ag.municipio = r.municipio || ag.municipio;

      const votosData = (r.votos_data as Record<string, number>) || {};
      for (const [actorId, votos] of Object.entries(votosData)) {
        ag.sumaPorActor.set(actorId, (ag.sumaPorActor.get(actorId) || 0) + votos);
      }

      ag.casillas.push({
        casilla: r.casilla,
        total_votos: r.total_votos,
        votos_nulos: r.votos_nulos,
        estatus_acta: r.estatus_acta,
        observaciones: r.observaciones,
      });
    }

    // Borrar proyecciones previas
    await this.prisma.seccionAnalisisProyeccion.deleteMany({
      where: { tenant_id: tenantId, eleccion_id: eleccionId },
    });

    // Crear/actualizar proyecciones
    for (const [seccion, ag] of porSeccion.entries()) {
      let ganadorId: string | null = null;
      let maxVotos = -1;
      for (const [actorId, votos] of ag.sumaPorActor.entries()) {
        if (votos > maxVotos) {
          maxVotos = votos;
          ganadorId = actorId;
        }
      }

      const porcentajeNulos = ag.total_votos > 0 ? (ag.votos_nulos / ag.total_votos) * 100 : 0;
      let clasificacion = 'PERSUASION';
      if (porcentajeNulos > 5) clasificacion = 'PRIORITARIA_RIESGO';
      else if (ganadorId && maxVotos > ag.total_votos * 0.45) clasificacion = 'BASTION';

      await this.prisma.seccionAnalisisProyeccion.create({
        data: {
          tenant_id: tenantId,
          eleccion_id: eleccionId,
          seccion,
          actor_ganador_id: ganadorId,
          porcentaje_votos_nulos: porcentajeNulos,
          clasificacion_estrategica: clasificacion,
          proyeccion_votos: null,
          lista_nominal_total: ag.lista_nominal,
          total_votos_total: ag.total_votos,
        },
      });
    }

    return { seccionesProcesadas: porSeccion.size };
  }

  // =====================
  // SECCIONES AGREGADAS
  // =====================
  async getSecciones(tenantId: string, eleccionId: string) {
    await this.findOneEleccion(tenantId, eleccionId);

    const proyecciones = await this.prisma.seccionAnalisisProyeccion.findMany({
      where: { tenant_id: tenantId, eleccion_id: eleccionId },
      include: {
        actor: {
          include: { partido: { select: { id: true, siglas: true, nombre: true, color_hex: true } } },
        },
      },
      orderBy: { seccion: 'asc' },
    });

    const resultados = await this.prisma.resultadoCasilla.findMany({
      where: { tenant_id: tenantId, eleccion_id: eleccionId },
      select: { seccion: true, votos_data: true },
    });

    // Sumar desglose por sección
    const desglosePorSeccion = new Map<string, Record<string, number>>();
    for (const r of resultados) {
      const vd = (r.votos_data as Record<string, number>) || {};
      if (!desglosePorSeccion.has(r.seccion)) desglosePorSeccion.set(r.seccion, {});
      const acum = desglosePorSeccion.get(r.seccion)!;
      for (const [actorId, votos] of Object.entries(vd)) {
        acum[actorId] = (acum[actorId] || 0) + votos;
      }
    }

    // Traer actores para mapear nombres
    const actores = await this.findActoresByEleccion(tenantId, eleccionId);
    const actorMap = new Map(actores.map((a) => [a.id, a]));

    return proyecciones.map((p) => {
      const desgloseRaw = desglosePorSeccion.get(p.seccion) || {};
      const desgloseConNombres: Record<string, number> = {};
      for (const [actorId, votos] of Object.entries(desgloseRaw)) {
        const actor = actorMap.get(actorId);
        desgloseConNombres[actor?.nombre_visual || actorId] = votos;
      }

      return {
        ...p,
        porcentaje_participacion: p.lista_nominal_total > 0 ? (p.total_votos_total / p.lista_nominal_total) * 100 : 0,
        desglose_votos: desgloseConNombres,
      };
    });
  }

  // =====================
  // ANÁLISIS CON IA (ANTHROPIC)
  // =====================
  async analizarSeccion(tenantId: string, eleccionId: string, seccionRaw: string) {
    const seccion = this.normalizarSeccion(seccionRaw);
    const eleccion = await this.findOneEleccion(tenantId, eleccionId);

    const proyeccion = await this.prisma.seccionAnalisisProyeccion.findUnique({
      where: { tenant_id_eleccion_id_seccion: { tenant_id: tenantId, eleccion_id: eleccionId, seccion } },
      include: {
        actor: {
          include: { partido: { select: { id: true, siglas: true, nombre: true, color_hex: true } } },
        },
      },
    });

    if (!proyeccion) throw new NotFoundException('Sección no encontrada para esta elección');

    const casillas = await this.prisma.resultadoCasilla.findMany({
      where: { tenant_id: tenantId, eleccion_id: eleccionId, seccion },
    });

    const actores = await this.findActoresByEleccion(tenantId, eleccionId);
    const actorMap = new Map(actores.map((a) => [a.id, a]));

    const desglose: Record<string, number> = {};
    const desgloseCasillas = casillas.map((c) => ({
      casilla: c.casilla,
      total_votos: c.total_votos,
      votos_nulos: c.votos_nulos,
      estatus_acta: c.estatus_acta,
      observaciones: c.observaciones,
    }));

    for (const c of casillas) {
      const vd = (c.votos_data as Record<string, number>) || {};
      for (const [actorId, votos] of Object.entries(vd)) {
        const actor = actorMap.get(actorId);
        const key = actor?.nombre_visual || actorId;
        desglose[key] = (desglose[key] || 0) + votos;
      }
    }

    const porcentajeParticipacion = proyeccion.lista_nominal_total > 0
      ? (proyeccion.total_votos_total / proyeccion.lista_nominal_total) * 100
      : 0;
    const porcentajeNulos = proyeccion.total_votos_total > 0
      ? (proyeccion.porcentaje_votos_nulos || 0)
      : 0;

    let iaResultado;
    try {
      iaResultado = await this.anthropic.analizarSeccion({
        seccion: proyeccion.seccion,
        municipio: casillas[0]?.municipio || 'No disponible',
        lista_nominal: proyeccion.lista_nominal_total || 0,
        total_votos: proyeccion.total_votos_total || 0,
        votos_nulos: Math.round((proyeccion.porcentaje_votos_nulos || 0) / 100 * (proyeccion.total_votos_total || 0)),
        porcentaje_participacion: porcentajeParticipacion,
        porcentaje_nulos: porcentajeNulos,
        actor_ganador: proyeccion.actor?.nombre_visual || 'Sin ganador',
        desglose,
        desglose_casillas: desgloseCasillas,
      });
    } catch (err) {
      iaResultado = {
        proyeccion_votos: Math.ceil(proyeccion.lista_nominal_total * 0.3),
        nivel_riesgo: 'MEDIO',
        auditoria_nulos_observaciones: 'No se pudo contactar al servicio de IA. Revise la configuración de ANTHROPIC_API_KEY.',
        estrategia: ['Revisar configuración de IA', 'Analizar manualmente los votos nulos'],
      };
    }

    await this.prisma.seccionAnalisisProyeccion.update({
      where: { id: proyeccion.id },
      data: {
        ia_analisis_cache: iaResultado,
        proyeccion_votos: iaResultado.proyeccion_votos,
      },
    });

    return {
      seccion: proyeccion.seccion,
      eleccion: eleccion.nombre,
      actor_ganador: proyeccion.actor?.nombre_visual || 'Sin ganador',
      color_ganador: proyeccion.actor?.color_hex || proyeccion.actor?.partido?.color_hex || null,
      clasificacion: proyeccion.clasificacion_estrategica,
      ...iaResultado,
    };
  }
}
