import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { ImportarResultadosDto, TipoHistorico, TipoEleccion } from './dto/importar-resultados.dto';

interface PreviewRow {
  fila: number;
  raw: Record<string, string>;
  procesado?: Record<string, any>;
  error?: string;
}

interface GuardadoResultado {
  tenant_id: string;
  tipo_historico: string;
  tipo_eleccion: string;
  anio: number;
  estado_id?: number;
  estado_nombre?: string;
  municipio_id?: number;
  municipio_nombre?: string;
  distrito_local_id?: number;
  distrito_federal_id?: number;
  seccion: string;
  casilla: string;
  tipo_casilla?: string;
  ext_contigua?: string;
  lista_nominal?: number;
  votos_nulos?: number;
  votos_no_reg?: number;
  votos_validos?: number;
  total_votos?: number;
  participacion_pct?: number;
  partido_ganador?: string;
  votos_ganador?: number;
  partido_principal?: string;
  desglose_partidos?: { partido: string; votos: number; tipo: 'individual' | 'coalicion' }[];
  sabana_completa?: { columna: string; valor: string }[];
}

// Aliases para campos de control. El primer alias de cada lista es el preferido.
const ALIASES_MAPEO: Record<string, string[]> = {
  seccion: ['SECCION', 'SECCIÓN', 'SECC', 'NO_SECCION', 'NO_SECC'],
  casilla: ['ID_CASILLA', 'CASILLA', 'NO_CASILLA', 'IDCASILLA', 'NUMERO_CASILLA'],
  tipo_casilla: ['TIPO_CASILLA', 'TIPO', 'TIPO_CAS', 'TIPO_CASILLA_'],
  ext_contigua: ['EXT_CONTIGUA', 'EXTCONTIGUA', 'EXT_CONT', 'CONTIGUA'],
  lista_nominal: ['LISTA_NOMINAL', 'LISTA_NOMINAL_CASILLA', 'LN', 'LN_CASILLA'],
  votos_nulos: ['NUM_VOTOS_NULOS', 'VOTOS_NULOS', 'NULOS', 'NUM_VOTOS_NULOS_CASILLA'],
  votos_no_reg: ['NUM_VOTOS_CAN_NREG', 'NUM_VOTOS_NO_REGISTRADOS', 'VOTOS_NO_REGISTRADOS', 'NOREG', 'VOTOS_CAN_NREG'],
  votos_validos: ['NUM_VOTOS_VALIDOS', 'VOTOS_VALIDOS', 'VALIDOS'],
  total_votos: ['TOTAL_VOTOS', 'TOTAL'],
  participacion_pct: ['PARTICIPACION_CONTABILIZADA', 'PARTICIPACION', 'PORC_PARTICIPACION', 'P_PARTICIPACION'],
  filtro_municipio_columna: ['MUNICIPIO', 'NOMBRE_MUNICIPIO', 'MUN', 'UBICACION', 'ID_MUNICIPIO', 'ID_UBICACION'],
};

// Columnas que NUNCA deben tratarse como actores (metadatos, control, totales, etc.)
const COLUMNAS_SISTEMA = new Set([
  'ID_ESTADO', 'NOMBRE_ESTADO', 'ESTADO',
  'ID_DISTRITO_LOCAL', 'DISTRITO_LOCAL', 'CABEZERA_DISTRITAL_LOCAL',
  'ID_DISTRITO_FEDERAL', 'DISTRITO_FEDERAL',
  'ID_MUNICIPIO', 'MUNICIPIO', 'NOMBRE_MUNICIPIO',
  'ID_UBICACION', 'UBICACION',
  'SECCION', 'SECCIÓN', 'SECC', 'NO_SECCION', 'NO_SECC',
  'TIPO_CASILLA', 'TIPO', 'TIPO_CAS',
  'ID_CASILLA', 'CASILLA', 'NO_CASILLA', 'IDCASILLA', 'NUMERO_CASILLA',
  'EXT_CONTIGUA', 'EXTCONTIGUA', 'EXT_CONT', 'CONTIGUA',
  'LISTA_NOMINAL', 'LISTA_NOMINAL_CASILLA', 'LN', 'LN_CASILLA',
  'NUM_VOTOS_VALIDOS', 'VOTOS_VALIDOS', 'VALIDOS',
  'NUM_VOTOS_CAN_NREG', 'NUM_VOTOS_NO_REGISTRADOS', 'VOTOS_NO_REGISTRADOS', 'NOREG', 'VOTOS_CAN_NREG',
  'NUM_VOTOS_NULOS', 'VOTOS_NULOS', 'NULOS',
  'TOTAL_VOTOS', 'TOTAL',
  'PARTICIPACION_CONTABILIZADA', 'PARTICIPACION', 'PORC_PARTICIPACION', 'P_PARTICIPACION',
  'ACTAS_ESPERADAS', 'ACTAS_COMPUTADAS', 'PORCENTAJE_ACTAS_COMPUTADAS', 'LN_COMPUTADA',
  'ESTATUS_ACTA', 'ESTATUS', 'ESTATUS_CASILLA',
  'COTEJADA', 'RECONTADA', 'CONTABILIZADA',
  'TRIBUNAL', 'OBSERVACIONES', 'RUTA_ACTA',
  'ACTA_CASILLA-MEC', 'ACTA_PREP', 'IDCASILLA',
  'ID_CENTRO_VOTACION', 'CENTRO_VOTACION',
]);

@Injectable()
export class ResultadosHistoricosService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // LISTADO
  // =====================================================
  async findAll(tenantId: string, filtros: {
    anio?: number;
    tipo_historico?: string;
    tipo_eleccion?: string;
    estado_id?: number;
    municipio_id?: number;
    seccion?: string;
    casilla?: string;
  }) {
    const where: any = { tenant_id: tenantId };
    if (filtros.anio) where.anio = filtros.anio;
    if (filtros.tipo_historico) where.tipo_historico = filtros.tipo_historico;
    if (filtros.tipo_eleccion) where.tipo_eleccion = filtros.tipo_eleccion;
    if (filtros.estado_id) where.estado_id = filtros.estado_id;
    if (filtros.municipio_id) where.municipio_id = filtros.municipio_id;
    if (filtros.seccion) where.seccion = this.formatearSeccion(filtros.seccion);
    if (filtros.casilla) where.casilla = filtros.casilla;

    return this.prisma.resultadoHistorico.findMany({
      where,
      orderBy: [
        { anio: 'desc' },
        { tipo_historico: 'asc' },
        { tipo_eleccion: 'asc' },
        { municipio_id: 'asc' },
        { seccion: 'asc' },
        { casilla: 'asc' },
      ],
    });
  }

  // =====================================================
  // RESUMEN POR PROYECTO
  // =====================================================
  async resumen(tenantId: string) {
    const rows = await this.prisma.resultadoHistorico.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ anio: 'desc' }, { tipo_historico: 'asc' }, { tipo_eleccion: 'asc' }],
    });

    const agrupados: Record<string, {
      tipo_historico: string;
      tipo_eleccion: string;
      anio: number;
      estado_id?: number;
      municipio_id?: number;
      registros: number;
      casillas: Set<string>;
      secciones: Set<string>;
      total_votos: number;
      partidos: Record<string, number>;
      partido_principal?: string;
    }> = {};

    for (const r of rows) {
      const key = `${r.tipo_historico}|${r.tipo_eleccion}|${r.anio}|${r.estado_id || ''}|${r.municipio_id || ''}`;
      if (!agrupados[key]) {
        agrupados[key] = {
          tipo_historico: r.tipo_historico,
          tipo_eleccion: r.tipo_eleccion,
          anio: r.anio,
          estado_id: r.estado_id || undefined,
          municipio_id: r.municipio_id || undefined,
          registros: 0,
          casillas: new Set(),
          secciones: new Set(),
          total_votos: 0,
          partidos: {},
          partido_principal: r.partido_principal || undefined,
        };
      }
      const g = agrupados[key];
      g.registros += 1;
      g.casillas.add(`${r.seccion}-${r.casilla}`);
      g.secciones.add(r.seccion);
      g.total_votos += r.total_votos || 0;

      const desglose = (r.desglose_partidos || []) as any[];
      for (const actor of desglose) {
        const nombre = actor.partido || actor.nombre || String(actor);
        const votos = Number(actor.votos || 0);
        g.partidos[nombre] = (g.partidos[nombre] || 0) + votos;
      }
    }

    const resumen = Object.values(agrupados).map((g) => ({
      ...g,
      casillas: g.casillas.size,
      secciones: g.secciones.size,
      partidos: Object.entries(g.partidos)
        .map(([partido, votos]) => ({ partido, votos }))
        .sort((a, b) => b.votos - a.votos),
      partido_principal: g.partido_principal,
    }));

    return {
      totalRegistros: rows.length,
      agrupados: resumen,
    };
  }

  // =====================================================
  // CRUCE HISTÓRICO POR SECCIÓN
  // =====================================================
  async cruce(
    tenantId: string,
    dto: {
      tipo_eleccion: string;
      tipo_historico?: string;
      anios?: number[];
      partidos_bloque?: string[];
    },
  ) {
    const where: any = { tenant_id: tenantId, tipo_eleccion: dto.tipo_eleccion };
    if (dto.tipo_historico) where.tipo_historico = dto.tipo_historico;
    if (dto.anios?.length) where.anio = { in: dto.anios };

    const rows = await this.prisma.resultadoHistorico.findMany({
      where,
      orderBy: [{ anio: 'desc' }, { seccion: 'asc' }, { casilla: 'asc' }],
    });

    if (rows.length === 0) {
      return { secciones: [], metadata: { anios: [], bloque: [], total_secciones: 0 } };
    }

    // Detectar partido principal del primer lote si no se envió bloque
    const partidoPrincipal = dto.partidos_bloque?.length
      ? dto.partidos_bloque[0]
      : (rows.find((r) => r.partido_principal)?.partido_principal || '');

    const bloque = dto.partidos_bloque?.length
      ? dto.partidos_bloque
      : this.inferirBloque(partidoPrincipal, rows);

    // Agrupar por año y sección
    const porAnioSeccion: Record<
      number,
      Record<
        string,
        {
          actores: Record<string, number>;
          total_votos: number;
          votos_validos: number;
          lista_nominal: number;
          votos_nulos: number;
          casillas: number;
        }
      >
    > = {};

    for (const r of rows) {
      const anio = r.anio;
      const seccion = this.formatearSeccion(r.seccion);
      if (!porAnioSeccion[anio]) porAnioSeccion[anio] = {};
      if (!porAnioSeccion[anio][seccion]) {
        porAnioSeccion[anio][seccion] = {
          actores: {},
          total_votos: 0,
          votos_validos: 0,
          lista_nominal: 0,
          votos_nulos: 0,
          casillas: 0,
        };
      }
      const celda = porAnioSeccion[anio][seccion];
      celda.total_votos += r.total_votos || 0;
      celda.votos_validos += r.votos_validos || 0;
      celda.lista_nominal += r.lista_nominal || 0;
      celda.votos_nulos += r.votos_nulos || 0;
      celda.casillas += 1;

      const desglose = (r.desglose_partidos || []) as any[];
      for (const actor of desglose) {
        const nombre = String(actor.partido || actor.nombre || '').toUpperCase().trim();
        const votos = Number(actor.votos || 0);
        if (!nombre || votos === 0) continue;
        celda.actores[nombre] = (celda.actores[nombre] || 0) + votos;
      }
    }

    const anios = Object.keys(porAnioSeccion).map(Number).sort((a, b) => b - a);
    const todasSecciones = new Set<string>();
    for (const anio of anios) {
      Object.keys(porAnioSeccion[anio]).forEach((s) => todasSecciones.add(s));
    }

    const resultadoSecciones = Array.from(todasSecciones)
      .sort()
      .map((seccion) => {
        const porAnio: Record<
          string,
          {
            votos_bloque: number;
            votos_ganador: number;
            votos_segundo: number;
            gano_bloque: boolean;
            pct_bloque: number;
            total_votos: number;
            votos_validos: number;
            lista_nominal: number;
            ganador?: string;
            segundo?: string;
          }
        > = {};

        let vecesGana = 0;
        let tendenciaBaseInicial: number | null = null;
        let tendenciaBaseFinal: number | null = null;
        const ganadoresHistoricos: Record<string, number> = {};

        for (const anio of anios) {
          const celda = porAnioSeccion[anio][seccion];
          if (!celda) continue;

          const actores = celda.actores;
          const entradas = Object.entries(actores).map(([partido, votos]) => ({ partido, votos }));
          const ordenados = entradas.sort((a, b) => b.votos - a.votos);
          const ganador = ordenados[0];
          const segundo = ordenados[1];

          const votosBloque = entradas
            .filter((e) => bloque.some((b) => e.partido === b || e.partido.includes(b)))
            .reduce((acc, e) => acc + e.votos, 0);

          const votosMaxOtro = entradas
            .filter((e) => !bloque.some((b) => e.partido === b || e.partido.includes(b)))
            .reduce((acc, e) => Math.max(acc, e.votos), 0);

          const ganoBloque = votosBloque >= (ganador?.votos || 0) && votosBloque > 0;
          if (ganoBloque) vecesGana += 1;

          if (tendenciaBaseFinal === null) tendenciaBaseFinal = votosBloque;
          tendenciaBaseInicial = votosBloque;

          if (ganador) ganadoresHistoricos[ganador.partido] = (ganadoresHistoricos[ganador.partido] || 0) + 1;

          porAnio[String(anio)] = {
            votos_bloque: votosBloque,
            votos_ganador: ganador?.votos || 0,
            votos_segundo: segundo?.votos || 0,
            gano_bloque: ganoBloque,
            pct_bloque: celda.votos_validos > 0 ? Number(((votosBloque / celda.votos_validos) * 100).toFixed(2)) : 0,
            total_votos: celda.total_votos,
            votos_validos: celda.votos_validos,
            lista_nominal: celda.lista_nominal,
            ganador: ganador?.partido,
            segundo: segundo?.partido,
          };
        }

        const totalAnios = anios.length;
        let clasificacion: string;
        if (vecesGana === totalAnios) clasificacion = 'BASTION';
        else if (vecesGana === 0) clasificacion = 'RIVAL';
        else if (vecesGana >= totalAnios / 2) clasificacion = 'VOLATIL_GANA';
        else clasificacion = 'VOLATIL_PIERDE';

        const ganadorHistoricoDominante = Object.entries(ganadoresHistoricos)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        return {
          seccion,
          anios: porAnio,
          veces_gana: vecesGana,
          total_anios: totalAnios,
          siempre_gana: vecesGana === totalAnios,
          siempre_pierde: vecesGana === 0,
          tendencia: (tendenciaBaseFinal || 0) - (tendenciaBaseInicial || 0),
          clasificacion,
          ganador_historico_dominante: ganadorHistoricoDominante,
        };
      });

    return {
      secciones: resultadoSecciones,
      metadata: {
        anios,
        bloque,
        partido_principal: partidoPrincipal,
        total_secciones: resultadoSecciones.length,
      },
    };
  }

  private inferirBloque(partidoPrincipal: string, rows: any[]): string[] {
    const bloque = new Set<string>([partidoPrincipal]);
    const nombresActores = new Set<string>();
    for (const r of rows) {
      const desglose = (r.desglose_partidos || []) as any[];
      for (const actor of desglose) {
        const nombre = String(actor.partido || actor.nombre || '').toUpperCase().trim();
        if (nombre) nombresActores.add(nombre);
      }
    }
    for (const actor of nombresActores) {
      if (actor.includes(partidoPrincipal) && actor.includes('_')) {
        bloque.add(actor);
      }
    }
    return Array.from(bloque);
  }

  // =====================================================
  // EXPLORACIÓN RAW DEL ARCHIVO
  // =====================================================
  previewRaw(archivo: Express.Multer.File, limite = 30) {
    if (!archivo) throw new BadRequestException('No se recibió archivo');

    const lineas = this.obtenerLineasConNumeros(archivo);
    const encabezadoDetectado = this.detectarFilaEncabezado(archivo);

    return {
      totalLineas: lineas.length,
      encabezadoDetectado,
      lineas: lineas.slice(0, limite).map((l) => ({
        numero: l.numero,
        contenido: l.contenido,
        columnas: this.parsearLineaCsv(l.contenido),
      })),
    };
  }

  // =====================================================
  // VISTA PREVIA DE IMPORTACIÓN
  // =====================================================
  async preview(
    tenantId: string,
    archivo: Express.Multer.File,
    dto: ImportarResultadosDto,
  ) {
    if (!archivo) throw new BadRequestException('No se recibió archivo');

    try {
      const lineas = this.obtenerLineasConNumeros(archivo);

      // `saltar_lineas` ahora es el número de línea ORIGINAL (1-based) del encabezado.
      // Si la línea elegida no parece encabezado, caemos al auto-detectado.
      const encabezadoDetectado = this.detectarFilaEncabezado(archivo);
      const saltarLineas = this.resolverFilaEncabezado(archivo, dto.saltar_lineas, encabezadoDetectado?.fila);

      const idxHeader = lineas.findIndex((l) => l.numero === saltarLineas);

      const columnas = idxHeader >= 0 ? this.parsearLineaCsv(lineas[idxHeader].contenido) : [];
      const filas = this.parsearCsv(archivo, saltarLineas);

      // En el paso de solo columnas no hay mapeo: devolvemos solo raw.
      const soloColumnas = !dto.mapeo?.seccion || !dto.mapeo?.casilla;
      const modoSabana = dto.mapeo?.seccion && dto.mapeo?.casilla && !dto.actores?.length;

      // Recorremos TODO el archivo para conteos exactos, pero solo devolvemos
      // una muestra de filas para la UI (evitando payloads de varios MB).
      const preview: PreviewRow[] = [];
      const previewSet = new Set<number>();
      const totales: Record<string, number> = {};
      let exitosas = 0;
      let errores = 0;
      let omitidasFiltro = 0;
      let omitidasVacias = 0;

      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const filaOriginal = lineas[idxHeader + 1 + i]?.numero ?? i + saltarLineas + 1;

        if (soloColumnas) {
          if (previewSet.size < 15) {
            previewSet.add(i);
            preview.push({ fila: filaOriginal, raw: fila });
          }
          exitosas += 1;
          continue;
        }

        const procesada = this.procesarFila(fila, dto, i + 1);
        const esError = 'error' in procesada;
        const esOmitidaFiltro = esError && procesada.error === 'OMITIDO_FILTRO';
        const esOmitidaVacia = esError && procesada.error === 'OMITIDO_VACIO';

        if (esOmitidaFiltro) {
          omitidasFiltro += 1;
        } else if (esOmitidaVacia) {
          omitidasVacias += 1;
        } else if (esError) {
          errores += 1;
        } else {
          exitosas += 1;
        }

        // Muestra: preferimos filas que pasaron el filtro.
        if (previewSet.size < 50) {
          previewSet.add(i);
          preview.push({
            fila: filaOriginal,
            raw: fila,
            procesado: esError ? undefined : procesada,
            error: esError ? procesada.error : undefined,
          });
        }

        if (!esError && !esOmitidaFiltro && !esOmitidaVacia) {
          if (modoSabana) {
            continue;
          }
          for (const actor of procesada.desglose_partidos || []) {
            totales[actor.partido] = (totales[actor.partido] || 0) + actor.votos;
          }
        }
      }

      // Calcular valores únicos de la columna de filtro para ayudar al usuario.
      let valoresUnicosFiltro: string[] | undefined;
      let filtroSinCoincidencias = false;
      if (dto.mapeo?.filtro_municipio_columna) {
        const unicos = new Set<string>();
        for (const fila of filas) {
          const v = this.obtenerValor(fila, dto.mapeo.filtro_municipio_columna);
          if (v) unicos.add(v.trim());
        }
        valoresUnicosFiltro = Array.from(unicos)
          .sort((a, b) => a.localeCompare(b))
          .slice(0, 30);
        if (dto.mapeo.filtro_municipio && omitidasFiltro > 0 && exitosas === 0) {
          filtroSinCoincidencias = true;
        }
      }

      // Detalle de errores bloqueantes para mostrar en la UI.
      const detallesErrores = preview
        .filter((p) => p.error && p.error !== 'OMITIDO_FILTRO' && p.error !== 'OMITIDO_VACIO')
        .slice(0, 20)
        .map((p) => ({ fila: p.fila, error: p.error || 'Error desconocido' }));

      // Warning si los actores mapeados no acumulan votos.
      const actoresSinVotos = (dto.actores?.length || 0) > 0 && Object.keys(totales).length === 0;

      return {
        columnas,
        totalFilas: filas.length,
        preview,
        totales,
        exitosas,
        errores,
        omitidasFiltro,
        omitidasVacias,
        valoresUnicosFiltro,
        filtroSinCoincidencias,
        detallesErrores,
        actoresSinVotos,
        parametros: dto,
        debug: { lineasFiltradas: lineas.length, idxHeader, saltarLineas },
        encabezadoDetectado,
      };
    } catch (err: any) {
      console.error('[preview] error inesperado', err?.stack || err?.message || err);
      throw new BadRequestException(`Error interno al generar vista previa: ${err?.message || err}`);
    }
  }

  // =====================================================
  // IMPORTACIÓN GUARDANDO EN BD
  // =====================================================
  async importar(
    tenantId: string,
    archivo: Express.Multer.File,
    dto: ImportarResultadosDto,
  ) {
    if (!archivo) throw new BadRequestException('No se recibió archivo');

    const encabezadoDetectado = this.detectarFilaEncabezado(archivo);
    const saltarLineas = this.resolverFilaEncabezado(archivo, dto.saltar_lineas, encabezadoDetectado?.fila);

    const filas = this.parsearCsv(archivo, saltarLineas);
    if (filas.length === 0) throw new BadRequestException('El archivo está vacío o no es un CSV válido');
    if (!dto.mapeo?.seccion || !dto.mapeo?.casilla) {
      throw new BadRequestException('Faltan mapeo de sección o casilla para importar');
    }

    let errores: { fila: number; error: string }[] = [];
    let duplicados = 0;
    let omitidasFiltro = 0;
    let omitidasVacias = 0;
    const guardados: GuardadoResultado[] = [];

    // Si el usuario pidió reemplazar, eliminamos primero el lote existente del mismo combo.
    if (dto.reemplazar) {
      await this.eliminarLote(tenantId, {
        tipo_historico: dto.tipo_historico,
        tipo_eleccion: dto.tipo_eleccion,
        anio: dto.anio,
        estado_id: dto.estado_id,
        municipio_id: dto.municipio_id,
      });
    }

    // Validar duplicados contra la BD antes de guardar
    const existentes = await this.prisma.resultadoHistorico.findMany({
      where: {
        tenant_id: tenantId,
        tipo_historico: dto.tipo_historico,
        tipo_eleccion: dto.tipo_eleccion,
        anio: dto.anio,
        estado_id: dto.estado_id || null,
        municipio_id: dto.municipio_id || null,
      },
      select: { id: true, seccion: true, casilla: true, tipo_casilla: true, ext_contigua: true },
    });
    const setExistentes = new Set(
      existentes.map((e) => `${e.seccion}|${e.casilla}|${e.tipo_casilla || ''}|${e.ext_contigua || ''}`),
    );

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const procesada = this.procesarFila(fila, dto, i + 1);

      if ('error' in procesada) {
        // Las filas omitidas por el filtro de municipio o vacías (resumen/totales) NO son errores.
        if (procesada.error === 'OMITIDO_FILTRO') {
          omitidasFiltro += 1;
          continue;
        }
        if (procesada.error === 'OMITIDO_VACIO') {
          omitidasVacias += 1;
          continue;
        }
        errores.push({ fila: i + 1, error: procesada.error });
        continue;
      }

      // La clave de unicidad debe incluir tipo de casilla y extensión contigua,
      // porque una misma sección/casilla puede repetirse con esos valores distintos.
      const clave = `${procesada.seccion}|${procesada.casilla}|${procesada.tipo_casilla || ''}|${procesada.ext_contigua || ''}`;
      if (setExistentes.has(clave)) {
        duplicados += 1;
        continue;
      }

      try {
        await this.prisma.resultadoHistorico.create({
          data: {
            ...procesada,
            tenant_id: tenantId,
          },
        });
        setExistentes.add(clave);
        guardados.push(procesada);
      } catch (err: any) {
        const msg = err?.message || err?.meta?.message || err?.code || 'Error al guardar';
        errores.push({ fila: i + 1, error: msg });
      }
    }

    return {
      totalFilas: filas.length,
      exitosos: guardados.length,
      duplicados,
      omitidasFiltro,
      omitidasVacias,
      errores: errores.length,
      detallesErrores: errores.slice(0, 20),
    };
  }

  // =====================================================
  // ELIMINAR HISTÓRICO COMPLETO
  // =====================================================
  async eliminarLote(
    tenantId: string,
    dto: {
      tipo_historico: string;
      tipo_eleccion: string;
      anio: number;
      estado_id?: number;
      municipio_id?: number;
    },
  ) {
    const where: any = {
      tenant_id: tenantId,
      tipo_historico: dto.tipo_historico,
      tipo_eleccion: dto.tipo_eleccion,
      anio: dto.anio,
    };
    if (dto.estado_id !== undefined) where.estado_id = dto.estado_id;
    if (dto.municipio_id !== undefined) where.municipio_id = dto.municipio_id;

    const { count } = await this.prisma.resultadoHistorico.deleteMany({ where });
    return { eliminados: count };
  }

  // =====================================================
  // HELPERS DE PROCESAMIENTO
  // =====================================================
  // El usuario trabaja con números de línea ORIGINALES (1-based) del archivo.
  // Internamente mapeamos a la línea filtrada que corresponde.
  private detectarColumnas(archivo: Express.Multer.File, saltarLineasOriginal: number): string[] {
    const lineas = this.obtenerLineasConNumeros(archivo);
    const idx = lineas.findIndex((l) => l.numero === saltarLineasOriginal);
    if (idx === -1) return [];
    return this.parsearLineaCsv(lineas[idx].contenido);
  }

  private parsearCsv(archivo: Express.Multer.File, saltarLineasOriginal: number): Record<string, string>[] {
    const lineas = this.obtenerLineasConNumeros(archivo);
    const idxHeader = lineas.findIndex((l) => l.numero === saltarLineasOriginal);
    if (idxHeader === -1 || idxHeader + 1 >= lineas.length) return [];

    const headers = this.parsearLineaCsv(lineas[idxHeader].contenido);
    const rows: Record<string, string>[] = [];

    for (let i = idxHeader + 1; i < lineas.length; i++) {
      const valores = this.parsearLineaCsv(lineas[i].contenido);
      if (valores.length === 0 || valores.every((v) => v === '')) continue;
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = valores[idx] || '';
      });
      rows.push(row);
    }

    return rows;
  }

  // Devuelve líneas significativas con su número de línea ORIGINAL.
  private obtenerLineasConNumeros(archivo: Express.Multer.File): { numero: number; contenido: string }[] {
    const raw = archivo.buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const resultado: { numero: number; contenido: string }[] = [];
    for (let i = 0; i < raw.length; i++) {
      const l = raw[i].trim();
      if (l === '' || l === '"' || /^"\s*"$/.test(l)) continue;
      resultado.push({ numero: i + 1, contenido: l });
    }
    return resultado;
  }

  // Parser CSV conforme a RFC 4180: comas, comillas dobles y comillas escapadas.
  private parsearLineaCsv(linea: string): string[] {
    const resultado: string[] = [];
    let actual = '';
    let entreComillas = false;

    for (let i = 0; i < linea.length; i++) {
      const char = linea[i];
      const next = linea[i + 1];

      if (char === '"') {
        if (entreComillas) {
          if (next === '"') {
            actual += '"';
            i++;
          } else {
            entreComillas = false;
          }
        } else {
          entreComillas = true;
        }
      } else if (char === ',' && !entreComillas) {
        resultado.push(actual.trim());
        actual = '';
      } else {
        actual += char;
      }
    }
    resultado.push(actual.trim());
    return resultado;
  }

  private puntajeEncabezado(columnas: string[]): { puntaje: number; detalle: string[] } {
    const normCols = columnas.map((c) => this.normalizarNombreColumna(c));
    const detalle: string[] = [];
    let puntaje = 0;

    const palabrasClaveControl = [
      'SECCION', 'ID_CASILLA', 'TIPO_CASILLA', 'LISTA_NOMINAL', 'TOTAL_VOTOS',
      'MUNICIPIO', 'UBICACION', 'ID_ESTADO', 'NOMBRE_ESTADO', 'ID_DISTRITO_LOCAL',
      'NUM_VOTOS_NULOS', 'NUM_VOTOS_VALIDOS', 'NUM_VOTOS_CAN_NREG', 'PARTICIPACION_CONTABILIZADA',
    ];
    const palabrasResumen = [
      'ACTAS_ESPERADAS', 'ACTAS_COMPUTADAS', 'PORCENTAJE_ACTAS_COMPUTADAS', 'LN_COMPUTADA',
      'TOTAL', 'TOTAL_VOTOS', 'SUMA', 'PORCENTAJE',
    ];

    for (const palabra of palabrasClaveControl) {
      if (normCols.includes(palabra)) {
        puntaje += 2;
        detalle.push(palabra);
      }
    }

    // Columnas que parecen actores numéricos
    let actores = 0;
    for (const col of columnas) {
      if (this.esColumnaSistema(col)) continue;
      const u = col.toUpperCase().trim();
      if (u.startsWith('P_') || u.startsWith('P.')) continue;
      if (/^[A-Z_\-]{2,40}$/.test(this.normalizarNombreColumna(col))) {
        actores += 1;
      }
    }
    if (actores > 0) {
      puntaje += Math.min(actores, 8);
      detalle.push(`${actores} posibles actores`);
    }

    // Penalizar líneas de resumen/totales
    for (const palabra of palabrasResumen) {
      if (normCols.includes(palabra)) {
        puntaje -= 3;
        detalle.push(`resumen:${palabra}`);
      }
    }

    // Penalizar si tiene muy pocas columnas
    if (columnas.filter((c) => c.trim() !== '').length < 5) {
      puntaje -= 5;
    }

    return { puntaje, detalle };
  }

  // Devuelve el número de línea ORIGINAL (1-based) que parece ser el encabezado real de casillas.
  detectarFilaEncabezado(archivo: Express.Multer.File): { fila: number; columnas: string[]; confianza: number } | null {
    const lineas = this.obtenerLineasConNumeros(archivo);

    let mejor: { fila: number; columnas: string[]; confianza: number; detalle: string[] } | null = null;
    for (const l of lineas.slice(0, 40)) {
      const columnas = this.parsearLineaCsv(l.contenido);
      const { puntaje, detalle } = this.puntajeEncabezado(columnas);
      if (puntaje >= 3 && (!mejor || puntaje > mejor.confianza)) {
        mejor = { fila: l.numero, columnas, confianza: puntaje, detalle };
      }
    }
    if (!mejor) return null;
    return { fila: mejor.fila, columnas: mejor.columnas, confianza: mejor.confianza };
  }

  private resolverFilaEncabezado(
    archivo: Express.Multer.File,
    lineaUsuario?: number,
    filaDetectada?: number,
  ): number {
    const lineas = this.obtenerLineasConNumeros(archivo);

    // Si el usuario eligió explícitamente una línea que existe, la respetamos
    // aunque no parezca encabezado, porque puede estar corrigiendo la detección.
    if (lineaUsuario && lineaUsuario > 0) {
      const idx = lineas.findIndex((l) => l.numero === lineaUsuario);
      if (idx >= 0) {
        return lineaUsuario;
      }
    }

    if (filaDetectada) return filaDetectada;
    return lineas[0]?.numero ?? 1;
  }

  // Sugiere un mapeo automático basado en nombres de columna conocidos.
  sugerirMapeo(
    columnas: string[],
    muestraFilas?: Record<string, string>[],
  ): {
    seccion?: string;
    casilla?: string;
    tipo_casilla?: string;
    ext_contigua?: string;
    lista_nominal?: string;
    votos_nulos?: string;
    votos_no_reg?: string;
    votos_validos?: string;
    total_votos?: string;
    participacion_pct?: string;
    filtro_municipio_columna?: string;
    actores: { nombre: string; columna: string; tipo: 'individual' | 'coalicion' }[];
  } {
    const buscar = (key: keyof typeof ALIASES_MAPEO) => this.buscarConAliases(columnas, ALIASES_MAPEO[key]);

    const actores = this.detectarActores(columnas, muestraFilas);

    return {
      seccion: buscar('seccion'),
      casilla: buscar('casilla'),
      tipo_casilla: buscar('tipo_casilla'),
      ext_contigua: buscar('ext_contigua'),
      lista_nominal: buscar('lista_nominal'),
      votos_nulos: buscar('votos_nulos'),
      votos_no_reg: buscar('votos_no_reg'),
      votos_validos: buscar('votos_validos'),
      total_votos: buscar('total_votos'),
      participacion_pct: buscar('participacion_pct'),
      filtro_municipio_columna: buscar('filtro_municipio_columna'),
      actores,
    };
  }

  private detectarActores(
    columnas: string[],
    muestraFilas?: Record<string, string>[],
  ): { nombre: string; columna: string; tipo: 'individual' | 'coalicion' }[] {
    const actores: { nombre: string; columna: string; tipo: 'individual' | 'coalicion' }[] = [];
    const partidosConocidos = new Set([
      'PAN', 'PRI', 'PRD', 'PVEM', 'PT', 'MC', 'MORENA', 'PANAL', 'PES', 'RSP', 'FXM', 'NAEM', 'PCM',
      'PAN_PRI_PRD', 'PRI_PRD', 'PAN_PRI', 'PAN_PRD', 'PVEM_PT_MORENA', 'PVEM_PT', 'PT_MORENA', 'PVEM_MORENA',
    ]);

    for (const col of columnas) {
      const norm = this.normalizarNombreColumna(col);
      const u = col.toUpperCase().trim();

      // Ignorar columnas de porcentaje (P_PAN, P_PRI, etc.) y de sistema
      if (u.startsWith('P_') || u.startsWith('P.')) continue;
      if (this.esColumnaSistema(col)) continue;

      // Si la muestra de filas indica que la columna no es numérica, descartar.
      if (muestraFilas && muestraFilas.length > 0) {
        const valoresNumericos = muestraFilas.filter((fila) => {
          const v = fila[col];
          if (!v || v.trim() === '' || v.trim() === '\\N' || v.trim() === '-') return false;
          const num = Number(v.replace(/,/g, '').replace(/%/g, '').trim());
          return !isNaN(num);
        }).length;
        if (valoresNumericos < muestraFilas.length * 0.5) {
          // Si no es numérica en al menos la mitad de las filas, no es un actor de votos.
          continue;
        }
      }

      // Nombre limpio para mostrar: sin prefijo P_ y sin comillas.
      const nombreMostrar = col.replace(/^P[_\.]/i, '').trim();

      // Determinar tipo
      let tipo: 'individual' | 'coalicion' = 'individual';
      if (partidosConocidos.has(norm)) {
        tipo = norm.includes('_') ? 'coalicion' : 'individual';
      } else if (/^[A-Z_\-]{2,40}$/.test(norm) && (norm.includes('_') || norm.includes('-'))) {
        tipo = 'coalicion';
      }

      actores.push({ nombre: nombreMostrar, columna: col, tipo });
    }

    return actores;
  }

  private normalizarNombreColumna(nombre: string): string {
    return nombre
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private buscarConAliases(columnas: string[], aliases: string[]): string | undefined {
    const normColumnas = columnas.map((c) => this.normalizarNombreColumna(c));
    for (const alias of aliases) {
      const normAlias = this.normalizarNombreColumna(alias);
      const idx = normColumnas.indexOf(normAlias);
      if (idx >= 0) return columnas[idx];
    }
    return undefined;
  }

  private esColumnaSistema(nombre: string): boolean {
    const norm = this.normalizarNombreColumna(nombre);
    return COLUMNAS_SISTEMA.has(norm);
  }

  // Normaliza texto para comparaciones insensibles a mayúsculas, acentos y espacios.
  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private procesarFila(
    row: Record<string, string>,
    dto: ImportarResultadosDto,
    index: number,
  ): GuardadoResultado | { error: string } {
    try {
      // Filtro por municipio (para sábanas estatales como IEEG)
      if (dto.mapeo.filtro_municipio && dto.mapeo.filtro_municipio_columna) {
        const valorUbicacion = this.obtenerValor(row, dto.mapeo.filtro_municipio_columna);
        const filtros = dto.mapeo.filtro_municipio
          .split(',')
          .map((f) => this.normalizarTexto(f))
          .filter((f) => f.length > 0);
        const ubicacion = this.normalizarTexto(String(valorUbicacion || ''));
        const coincide = filtros.some((f) => ubicacion.includes(f));
        if (!coincide) {
          return { error: 'OMITIDO_FILTRO' };
        }
      }

      const seccionRaw = this.obtenerValor(row, dto.mapeo.seccion);
      if (!seccionRaw) return { error: 'OMITIDO_VACIO' };
      const seccion = this.formatearSeccion(seccionRaw);
      // Si después de formatear la sección sigue vacía, es una fila de resumen/total.
      if (!seccion || seccion === '0000') return { error: 'OMITIDO_VACIO' };

      const casillaRaw = this.obtenerValor(row, dto.mapeo.casilla);
      if (!casillaRaw) return { error: 'OMITIDO_VACIO' };
      const casilla = String(casillaRaw).trim().toUpperCase();

      const total_votos = this.parsearNumero(this.obtenerValor(row, dto.mapeo.total_votos));
      const votos_validos = this.parsearNumero(this.obtenerValor(row, dto.mapeo.votos_validos));
      const votos_nulos = this.parsearNumero(this.obtenerValor(row, dto.mapeo.votos_nulos));
      const votos_no_reg = this.parsearNumero(this.obtenerValor(row, dto.mapeo.votos_no_reg));
      const lista_nominal = this.parsearNumero(this.obtenerValor(row, dto.mapeo.lista_nominal));
      const participacion_pct = this.parsearFloat(this.obtenerValor(row, dto.mapeo.participacion_pct));

      // Modo sábana completa: no hay actores mapeados, guardamos todas las columnas tal cual.
      if (!dto.actores?.length) {
        const sabana = Object.entries(row).map(([columna, valor]) => ({
          columna: columna.toUpperCase().trim(),
          valor: valor.trim(),
        }));

        return {
          tenant_id: '', // se llena al guardar
          tipo_historico: dto.tipo_historico,
          tipo_eleccion: dto.tipo_eleccion,
          anio: dto.anio,
          estado_id: dto.estado_id,
          estado_nombre: dto.estado_nombre,
          municipio_id: dto.municipio_id,
          municipio_nombre: dto.municipio_nombre,
          distrito_local_id: dto.distrito_local_id,
          distrito_federal_id: dto.distrito_federal_id,
          seccion,
          casilla,
          tipo_casilla: this.obtenerValor(row, dto.mapeo.tipo_casilla),
          ext_contigua: this.obtenerValor(row, dto.mapeo.ext_contigua),
          lista_nominal,
          votos_nulos,
          votos_no_reg,
          votos_validos,
          total_votos,
          participacion_pct,
          partido_principal: dto.partido_principal,
          sabana_completa: sabana,
        };
      }

      const desglose: { partido: string; votos: number; tipo: 'individual' | 'coalicion' }[] = [];
      let totalCalculado = 0;

      for (const actor of dto.actores || []) {
        const raw = this.obtenerValor(row, actor.columna);
        const votos = this.parsearNumero(raw);
        if (votos !== undefined && votos > 0) {
          desglose.push({
            partido: actor.nombre.toUpperCase().trim(),
            votos,
            tipo: actor.tipo === 'coalicion' ? 'coalicion' : 'individual',
          });
          totalCalculado += votos;
        }
      }

      // Calcular ganador del desglose
      let partido_ganador: string | undefined;
      let votos_ganador: number | undefined;
      const candidatos = desglose.filter((d) => d.tipo === 'individual');
      if (candidatos.length > 0) {
        const ganador = candidatos.sort((a, b) => b.votos - a.votos)[0];
        partido_ganador = ganador.partido;
        votos_ganador = ganador.votos;
      }

      // Validación lógica opcional: total = validos + nulos + no_reg
      const sumaControl = (votos_validos || 0) + (votos_nulos || 0) + (votos_no_reg || 0);
      if (total_votos !== undefined && sumaControl > 0 && Math.abs(total_votos - sumaControl) > 5) {
        // Solo advertencia en preview, no error bloqueante
      }

      return {
        tenant_id: '', // se llena al guardar
        tipo_historico: dto.tipo_historico,
        tipo_eleccion: dto.tipo_eleccion,
        anio: dto.anio,
        estado_id: dto.estado_id,
        estado_nombre: dto.estado_nombre,
        municipio_id: dto.municipio_id,
        municipio_nombre: dto.municipio_nombre,
        distrito_local_id: dto.distrito_local_id,
        distrito_federal_id: dto.distrito_federal_id,
        seccion,
        casilla,
        tipo_casilla: this.obtenerValor(row, dto.mapeo.tipo_casilla),
        ext_contigua: this.obtenerValor(row, dto.mapeo.ext_contigua),
        lista_nominal,
        votos_nulos,
        votos_no_reg,
        votos_validos,
        total_votos,
        participacion_pct,
        partido_ganador,
        votos_ganador,
        partido_principal: dto.partido_principal,
        desglose_partidos: desglose,
      };
    } catch (err: any) {
      return { error: err.message || 'Error procesando fila' };
    }
  }

  private obtenerValor(row: Record<string, string>, columna?: string): string | undefined {
    if (!columna) return undefined;
    const valor = row[columna];
    if (valor == null || String(valor).trim() === '') return undefined;
    return String(valor).trim();
  }

  private formatearSeccion(valor: string): string {
    const num = String(valor).replace(/\D/g, '');
    return num.padStart(4, '0').slice(0, 4);
  }

  private parsearNumero(value: string | undefined): number | undefined {
    if (!value || value.trim() === '\\N' || value.trim() === '-') return undefined;
    const limpio = value.replace(/,/g, '').replace(/%/g, '').trim();
    const num = Number(limpio);
    return isNaN(num) ? undefined : num;
  }

  private parsearFloat(value: string | undefined): number | undefined {
    if (!value || value.trim() === '\\N') return undefined;
    const limpio = value.replace(/,/g, '').replace(/%/g, '').trim();
    const num = parseFloat(limpio);
    return isNaN(num) ? undefined : num;
  }
}
