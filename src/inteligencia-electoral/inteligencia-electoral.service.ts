import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../common/services/prisma.service';
import { AnthropicService } from '../common/services/anthropic.service';
import { CrearPartidoDto, ActualizarPartidoDto } from './dto/crear-partido.dto';
import { CrearEleccionDto, ActualizarEleccionDto } from './dto/crear-eleccion.dto';
import { CrearActorDto, ActualizarActorDto } from './dto/crear-actor.dto';
import { ConsultaIADto } from './dto/consulta-ia.dto';

@Injectable()
export class InteligenciaElectoralService {
  private readonly logger = new Logger(InteligenciaElectoralService.name);

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
    const puestoKey = this.normalizarPuesto(dto.puesto);
    const nombreSugerido = `${this.nombrePuesto(puestoKey)} ${dto.anio}`;
    return this.prisma.eleccion.create({
      data: {
        tenant_id: tenantId,
        nombre: dto.nombre?.trim() || nombreSugerido,
        anio: dto.anio,
        puesto: puestoKey,
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
        tipo_voto: dto.tipo_voto || 'TOTAL',
        tipo_actor: dto.tipo_actor || 'PARTIDO',
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
        tipo_voto: dto.tipo_voto,
        tipo_actor: dto.tipo_actor,
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
      'AÑO_ELECCION',
      'CARGO',
      'PAIS',
      'ESTADO_NOMBRE',
      'ID_ESTADO',
      'MUNICIPIO',
      'ID_MUNICIPIO',
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
      if (h === 'AÑO_ELECCION') ejemplo.push(eleccion.anio);
      else if (h === 'CARGO') ejemplo.push(eleccion.puesto);
      else if (h === 'PAIS') ejemplo.push('México');
      else if (h === 'ESTADO_NOMBRE') ejemplo.push('Ej. Sinaloa');
      else if (['ID_ESTADO', 'ID_MUNICIPIO'].includes(h)) ejemplo.push('00');
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

      // Metadatos de la sabana (opcionales; se validan suavemente)
      const anioFila = this.numero(row.AÑO_ELECCION || row['AÑO ELECCION'] || row.anio_eleccion || row.ano_eleccion || 0);
      const cargoFila = this.normalizarTexto(row.CARGO || row.cargo || '');
      const paisFila = this.normalizarTexto(row.PAIS || row.pais || '');
      const estadoNombreFila = this.normalizarTexto(row.ESTADO_NOMBRE || row['ESTADO NOMBRE'] || row.estado_nombre || row.estado || '');

      let estadoId = this.normalizarTexto(row.ID_ESTADO || row['ID ESTADO'] || row.id_estado || row.estado_id);
      if (!estadoId && estadoNombreFila) {
        estadoId = this.idEstadoPorNombre(estadoNombreFila);
      }
      const municipioId = this.normalizarTexto(row.ID_MUNICIPIO || row['ID MUNICIPIO'] || row.id_municipio || row.municipio_id);
      const municipio = String(row.MUNICIPIO || row.municipio || '').trim();
      let seccion = this.normalizarSeccion(row.SECCION || row.seccion || row.Seccion || row['SECCION ']);
      const casilla = String(row.CASILLA || row.casilla || row.CASILL || '').trim();
      const listaNominal = this.numero(row.LISTA_NOMINAL || row['LISTA NOMINAL'] || row.lista_nominal || 0);

      // Validaciones suaves de metadatos (sólo advertencias)
      if (anioFila && anioFila !== eleccion.anio) {
        errores.push({ fila, seccion, casilla, error: `Año ${anioFila} no coincide con el año de la elección (${eleccion.anio}). Se ignorará.` });
      }
      if (cargoFila && cargoFila.toLowerCase() !== eleccion.puesto.toLowerCase()) {
        errores.push({ fila, seccion, casilla, error: `Cargo "${cargoFila}" no coincide con "${eleccion.puesto}". Se ignorará.` });
      }

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
  // MAPA DE SECCIONES COLOREADO POR GANADOR
  // =====================
  async generarMapaSecciones(tenantId: string, eleccionId: string) {
    const eleccion = await this.findOneEleccion(tenantId, eleccionId);

    // Buscar capa de secciones del INE para este tenant
    const capaSecciones = await this.prisma.capaMapa.findFirst({
      where: {
        tenant_id: tenantId,
        tipo: 'secciones_ine',
        metadata: { path: ['nivel'], equals: 'seccion' },
      },
    });

    if (!capaSecciones || !capaSecciones.geojson) {
      throw new NotFoundException('No se encontró una capa de secciones electorales cargada. Sube el shapefile de secciones primero.');
    }

    const proyecciones = await this.prisma.seccionAnalisisProyeccion.findMany({
      where: { tenant_id: tenantId, eleccion_id: eleccionId },
      include: {
        actor: {
          include: { partido: { select: { id: true, siglas: true, nombre: true, color_hex: true } } },
        },
      },
    });

    const proyeccionPorSeccion = new Map(
      proyecciones.map((p) => [p.seccion.padStart(4, '0'), p]),
    );

    const fc = capaSecciones.geojson as { type: 'FeatureCollection'; features: any[] };
    const featuresColoreados = fc.features.map((feature: any) => {
      const seccionRaw = feature.properties?.SECCION ?? feature.properties?.seccion ?? feature.properties?.SECC ?? '';
      const seccion = String(seccionRaw).padStart(4, '0');
      const proy = proyeccionPorSeccion.get(seccion);

      const color = proy?.actor?.color_hex || proy?.actor?.partido?.color_hex || '#9CA3AF';
      return {
        ...feature,
        properties: {
          ...feature.properties,
          _eleccion_id: eleccionId,
          _eleccion_nombre: eleccion.nombre,
          _seccion_normalizada: seccion,
          _actor_ganador: proy?.actor?.nombre_visual || 'Sin datos',
          _actor_ganador_id: proy?.actor_ganador_id || null,
          _color_ganador: color,
          _clasificacion: proy?.clasificacion_estrategica || 'SIN_DATOS',
          _porcentaje_nulos: proy?.porcentaje_votos_nulos || 0,
          _total_votos: proy?.total_votos_total || 0,
          _lista_nominal: proy?.lista_nominal_total || 0,
          _tiene_datos: !!proy,
        },
      };
    });

    return {
      type: 'FeatureCollection',
      features: featuresColoreados,
      properties: {
        eleccion_id: eleccionId,
        eleccion_nombre: eleccion.nombre,
        anio: eleccion.anio,
        puesto: eleccion.puesto,
        total_secciones: featuresColoreados.length,
        secciones_con_datos: proyecciones.length,
      },
    };
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

  // =====================
  // CONSULTOR IA (PROMPT LIBRE)
  // =====================
  async consultarIA(tenantId: string, dto: ConsultaIADto) {
    const { pregunta, contextoCampana, eleccionId } = dto;

    const [
      resumenProyeccion,
      seccionesProyeccion,
      historicos,
      votantesResumen,
      casillas,
      eleccionContexto,
    ] = await Promise.all([
      this.obtenerResumenProyeccion(tenantId),
      this.obtenerProyeccionPorSeccion(tenantId),
      this.obtenerHistorico(tenantId),
      this.obtenerResumenVotantes(tenantId),
      this.obtenerResumenCasillas(tenantId),
      eleccionId ? this.obtenerContextoEleccion(tenantId, eleccionId) : null,
    ]);

    const contexto = {
      tenant_id: tenantId,
      eleccion: eleccionContexto,
      campana: contextoCampana || null,
      proyeccion: resumenProyeccion,
      proyeccion_por_seccion_o_zona: seccionesProyeccion.slice(0, 50),
      historico_electoral: historicos.slice(0, 50),
      votantes: votantesResumen,
      sedes_casillas: casillas,
    };

    let respuesta: string;
    try {
      respuesta = await this.anthropic.consultarPolitico({
        pregunta,
        contexto,
      });
    } catch (err) {
      this.logger.error('Error consultando IA:', err);
      throw new BadRequestException('El servicio de IA no está disponible en este momento. Verifica ANTHROPIC_API_KEY.');
    }

    return {
      pregunta,
      respuesta,
      eleccion_id: eleccionId || null,
      contexto_resumen: {
        proyeccion: resumenProyeccion,
        votantes: votantesResumen,
        sedes: casillas,
        historicos: historicos.length,
      },
    };
  }

  private async obtenerResumenProyeccion(tenantId: string) {
    try {
      // Importación dinámica para evitar dependencia circular si en el futuro ProyeccionService importa este servicio
      const { ProyeccionService } = await import('../proyeccion/proyeccion.service');
      const proyeccion = new ProyeccionService(this.prisma as any);
      return proyeccion.resumen(tenantId);
    } catch (err) {
      this.logger.warn('No se pudo cargar resumen de proyección', err);
      return null;
    }
  }

  private async obtenerProyeccionPorSeccion(tenantId: string) {
    try {
      const { ProyeccionService } = await import('../proyeccion/proyeccion.service');
      const proyeccion = new ProyeccionService(this.prisma as any);
      return proyeccion.porSeccion(tenantId);
    } catch (err) {
      this.logger.warn('No se pudo cargar proyección por sección', err);
      return [];
    }
  }

  private async obtenerHistorico(tenantId: string) {
    return this.prisma.resultadoHistorico.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ anio: 'desc' }, { seccion: 'asc' }],
      take: 200,
    });
  }

  private async obtenerResumenVotantes(tenantId: string) {
    const [total, porSeccion, porNivel, porZona] = await Promise.all([
      this.prisma.votante.count({ where: { tenant_id: tenantId, activo: true } }),
      this.prisma.votante.groupBy({
        by: ['seccion_electoral'],
        where: { tenant_id: tenantId, activo: true },
        _count: { id: true },
      }),
      this.prisma.votante.groupBy({
        by: ['nivel_apoyo'],
        where: { tenant_id: tenantId, activo: true },
        _count: { id: true },
      }),
      this.prisma.$queryRawUnsafe<any[]>(`
        SELECT z.nombre as zona, COUNT(v.id)::int as total
        FROM votantes v
        LEFT JOIN zonas z ON z.id::text = (v.metadata->>'zona_id')::text
        WHERE v.tenant_id = $1::uuid AND v.activo = true
        GROUP BY z.nombre
        ORDER BY total DESC
        LIMIT 20
      `, tenantId),
    ]);

    return {
      total,
      por_seccion: porSeccion
        .filter((s) => s.seccion_electoral)
        .map((s) => ({ seccion: s.seccion_electoral, total: s._count.id }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 30),
      por_nivel_apoyo: porNivel.map((n) => ({
        nivel: n.nivel_apoyo ?? 'sin_nivel',
        total: n._count.id,
      })),
      por_zona: porZona || [],
    };
  }

  private async obtenerResumenCasillas(tenantId: string) {
    const [total, porStatus, porSeccion] = await Promise.all([
      this.prisma.casilla.count({ where: { tenant_id: tenantId } }),
      this.prisma.casilla.groupBy({
        by: ['status'],
        where: { tenant_id: tenantId },
        _count: { id: true },
      }),
      this.prisma.casilla.groupBy({
        by: ['seccion'],
        where: { tenant_id: tenantId },
        _count: { id: true },
      }),
    ]);

    return {
      total,
      por_status: porStatus.map((s) => ({ status: s.status, total: s._count.id })),
      por_seccion: porSeccion
        .map((s) => ({ seccion: s.seccion, total: s._count.id }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 30),
    };
  }

  private async obtenerContextoEleccion(tenantId: string, eleccionId: string) {
    try {
      const eleccion = await this.findOneEleccion(tenantId, eleccionId);
      const secciones = await this.getSecciones(tenantId, eleccionId);
      return {
        id: eleccion.id,
        nombre: eleccion.nombre,
        anio: eleccion.anio,
        puesto: eleccion.puesto,
        actores: eleccion.actores.map((a: any) => ({
          nombre: a.nombre_visual,
          siglas: a.partido?.siglas || a.tipo_actor,
          color: a.color_hex || a.partido?.color_hex,
        })),
        resumen_secciones: {
          total: secciones.length,
          bastiones: secciones.filter((s: any) => s.clasificacion_estrategica === 'BASTION').length,
          riesgo: secciones.filter((s: any) => s.clasificacion_estrategica === 'PRIORITARIA_RIESGO').length,
          persuasion: secciones.filter((s: any) => s.clasificacion_estrategica === 'PERSUASION').length,
        },
      };
    } catch (err) {
      this.logger.warn('No se pudo cargar contexto de elección', err);
      return null;
    }
  }

  // =====================
  // SÁBANA COMPLETA (DESCARGA)
  // =====================
  async generarSabana(tenantId: string, eleccionId: string) {
    const eleccion = await this.findOneEleccion(tenantId, eleccionId);
    const actores = await this.findActoresByEleccion(tenantId, eleccionId);
    const actorMap = new Map(actores.map((a) => [a.id, a]));

    const resultados = await this.prisma.resultadoCasilla.findMany({
      where: { tenant_id: tenantId, eleccion_id: eleccionId },
      orderBy: [{ seccion: 'asc' }, { casilla: 'asc' }],
    });

    // Calcular totales por sección y actor
    const totalesPorSeccion = new Map<
      string,
      { lista_nominal: number; total_votos: number; por_actor: Map<string, number> }
    >();
    for (const r of resultados) {
      if (!totalesPorSeccion.has(r.seccion)) {
        totalesPorSeccion.set(r.seccion, { lista_nominal: 0, total_votos: 0, por_actor: new Map() });
      }
      const t = totalesPorSeccion.get(r.seccion)!;
      t.lista_nominal += r.lista_nominal || 0;
      t.total_votos += r.total_votos || 0;
      const vd = (r.votos_data as Record<string, number>) || {};
      for (const [aid, votos] of Object.entries(vd)) {
        t.por_actor.set(aid, (t.por_actor.get(aid) || 0) + votos);
      }
    }

    const columnasBase = [
      'AÑO_ELECCION',
      'CARGO',
      'PAIS',
      'ESTADO_NOMBRE',
      'ID_ESTADO',
      'MUNICIPIO',
      'ID_MUNICIPIO',
      'SECCION',
      'CASILLA',
      'LISTA_NOMINAL',
    ];
    const columnasActores = actores.map((a) => a.columna_excel_alias);
    const columnasTotales = ['VOTOS_NO_REG', 'VOTOS_NULOS', 'TOTAL_VOTOS', 'ESTATUS_ACTA', 'OBSERVACIONES'];
    const columnasResumenSeccion = actores.map((a) => `VOTOS_SECCION_${a.columna_excel_alias}`);
    const columnasCandidato = actores.map((a) => `NOMBRE_CANDIDATO_${a.columna_excel_alias}`);

    const headers = [
      ...columnasBase,
      ...columnasActores,
      ...columnasTotales,
      ...columnasResumenSeccion,
      ...columnasCandidato,
    ];

    const rows: any[] = [headers];
    for (const r of resultados) {
      const vd = (r.votos_data as Record<string, number>) || {};
      const totalesSeccion = totalesPorSeccion.get(r.seccion)!;
      const base = [
        eleccion.anio,
        eleccion.puesto,
        'México',
        this.nombreEstadoMexico(r.estado_id),
        r.estado_id,
        r.municipio,
        r.municipio_id,
        r.seccion,
        r.casilla,
        r.lista_nominal,
      ];
      const votosActores = columnasActores.map((a) => {
        const actorId = actorMap.get(actores.find((x) => x.columna_excel_alias === a)?.id || '')?.id;
        return actorId ? (vd[actorId] || 0) : 0;
      });
      const totales = [r.votos_no_registrados, r.votos_nulos, r.total_votos, r.estatus_acta || '', r.observaciones || ''];
      const resumen = columnasResumenSeccion.map((col) => {
        const alias = col.replace('VOTOS_SECCION_', '');
        const actorId = actorMap.get(actores.find((x) => x.columna_excel_alias === alias)?.id || '')?.id;
        return actorId ? (totalesSeccion.por_actor.get(actorId) || 0) : 0;
      });
      const nombres = columnasCandidato.map((col) => {
        const alias = col.replace('NOMBRE_CANDIDATO_', '');
        const actor = actorMap.get(actores.find((x) => x.columna_excel_alias === alias)?.id || '')?.id || null;
        return actor ? (actorMap.get(actor)?.nombre_visual || '') : '';
      });

      rows.push([...base, ...votosActores, ...totales, ...resumen, ...nombres]);
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Sabana');

    // Resumen por sección en segunda hoja
    const resumenHeaders = ['SECCION', 'LISTA_NOMINAL_SECCION', 'TOTAL_VOTOS_SECCION', ...actores.map((a) => `VOTOS_SECCION_${a.columna_excel_alias}`), 'VOTOS_NULOS_SECCION', 'GANADOR', 'CLASIFICACION'];
    const proyecciones = await this.prisma.seccionAnalisisProyeccion.findMany({
      where: { tenant_id: tenantId, eleccion_id: eleccionId },
      include: { actor: true },
      orderBy: { seccion: 'asc' },
    });
    const resumenRows: any[] = [resumenHeaders];
    for (const p of proyecciones) {
      const ts = totalesPorSeccion.get(p.seccion);
      const actorCols = actores.map((a) => ts?.por_actor.get(a.id) || 0);
      resumenRows.push([
        p.seccion,
        p.lista_nominal_total || 0,
        p.total_votos_total || 0,
        ...actorCols,
        Math.round((p.porcentaje_votos_nulos || 0) / 100 * (p.total_votos_total || 0)),
        p.actor?.nombre_visual || 'Sin ganador',
        p.clasificacion_estrategica,
      ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumenRows), 'Resumen por sección');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `sabana_${eleccion.nombre.replace(/\s+/g, '_')}_${eleccion.anio}.xlsx`;
    return { buffer, filename };
  }

  private nombreEstadoMexico(id: string): string {
    const mapa: Record<string, string> = {
      '01': 'Aguascalientes', '02': 'Baja California', '03': 'Baja California Sur', '04': 'Campeche',
      '05': 'Coahuila', '06': 'Colima', '07': 'Chiapas', '08': 'Chihuahua', '09': 'Ciudad de México',
      '10': 'Durango', '11': 'Guanajuato', '12': 'Guerrero', '13': 'Hidalgo', '14': 'Jalisco',
      '15': 'México', '16': 'Michoacán', '17': 'Morelos', '18': 'Nayarit', '19': 'Nuevo León',
      '20': 'Oaxaca', '21': 'Puebla', '22': 'Querétaro', '23': 'Quintana Roo', '24': 'San Luis Potosí',
      '25': 'Sinaloa', '26': 'Sonora', '27': 'Tabasco', '28': 'Tamaulipas', '29': 'Tlaxcala',
      '30': 'Veracruz', '31': 'Yucatán', '32': 'Zacatecas',
    };
    return mapa[id.padStart(2, '0')] || id || '';
  }

  private normalizarPuesto(puesto: string): string {
    const mapa: Record<string, string> = {
      'presidente': 'Presidente República',
      'presidente de la republica': 'Presidente República',
      'presidente de la república': 'Presidente República',
      'presidente republica': 'Presidente República',
      'diputado federal': 'Diputaciones Federales',
      'diputados federales': 'Diputaciones Federales',
      'diputacion federal': 'Diputaciones Federales',
      'diputado local': 'Diputaciones Locales',
      'diputados locales': 'Diputaciones Locales',
      'diputacion local': 'Diputaciones Locales',
      'alcalde': 'Alcalde',
      'presidente municipal': 'Alcalde',
      'municipal': 'Alcalde',
      'otro': 'Otro',
    };
    const k = puesto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    return mapa[k] || puesto.trim();
  }

  private nombrePuesto(puestoKey: string): string {
    return puestoKey;
  }

  private idEstadoPorNombre(nombre: string): string {
    const mapa: Record<string, string> = {
      'aguascalientes': '01', 'baja california': '02', 'baja california sur': '03', 'campeche': '04',
      'coahuila': '05', 'colima': '06', 'chiapas': '07', 'chihuahua': '08', 'ciudad de méxico': '09',
      'durango': '10', 'guanajuato': '11', 'guerrero': '12', 'hidalgo': '13', 'jalisco': '14',
      'méxico': '15', 'michoacán': '16', 'morelos': '17', 'nayarit': '18', 'nuevo león': '19',
      'oaxaca': '20', 'puebla': '21', 'querétaro': '22', 'quintana roo': '23', 'san luis potosí': '24',
      'sinaloa': '25', 'sonora': '26', 'tabasco': '27', 'tamaulipas': '28', 'tlaxcala': '29',
      'veracruz': '30', 'yucatán': '31', 'zacatecas': '32',
    };
    return mapa[nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()] || '0';
  }
}
