import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';
import { PrismaService } from '../common/services/prisma.service';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { InegiService, TipoCapaInegi } from '../inegi/inegi.service';
import { NominatimService } from '../inegi/nominatim.service';

const TIPOS_CAPA = ['territorio', 'apoyos', 'lideres', 'votantes', 'secciones_ine', 'eventos', 'recorridos', 'custom', 'inegi', 'colonia'];
const ORIGENES_CAPA = ['propia', 'externa', 'neutral'];

const CAPAS_PREDEFINIDAS = [
  { id: 'zonas', tipo: 'territorio', nombre: 'Zonas de trabajo', origen: 'propia', color: '#3B82F6', visible: true, orden: 1 },
  { id: 'secciones_ine', tipo: 'secciones_ine', nombre: 'Secciones INE', origen: 'neutral', color: '#9CA3AF', visible: false, orden: 2 },
  { id: 'lideres', tipo: 'lideres', nombre: 'Líderes territoriales', origen: 'propia', color: '#10B981', visible: true, orden: 3 },
  { id: 'votantes', tipo: 'votantes', nombre: 'Votantes / simpatizantes', origen: 'propia', color: '#8B5CF6', visible: false, orden: 4 },
  { id: 'apoyos', tipo: 'apoyos', nombre: 'Apoyos entregados', origen: 'propia', color: '#F59E0B', visible: true, orden: 5 },
  { id: 'peticiones', tipo: 'peticiones', nombre: 'Peticiones ciudadanas', origen: 'propia', color: '#06B6D4', visible: true, orden: 6 },
  { id: 'eventos', tipo: 'eventos', nombre: 'Eventos / mítines', origen: 'propia', color: '#EF4444', visible: true, orden: 7 },
  { id: 'recorridos', tipo: 'recorridos', nombre: 'Recorridos de brigada', origen: 'propia', color: '#06B6D4', visible: false, orden: 8 },
];

@Injectable()
export class MapasService {
  constructor(
    private prisma: PrismaService,
    @Optional() private inegiService?: InegiService,
    @Optional() private nominatimService?: NominatimService,
  ) {}

  // ======================
  // CAPAS (CRUD personalizadas)
  // ======================
  async findAllCapas(tenantId: string) {
    const personalizadas = await this.prisma.capaMapa.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      include: { creador: { select: { id: true, nombre: true } } },
    });

    return {
      predefinidas: CAPAS_PREDEFINIDAS,
      personalizadas,
    };
  }

  async findOneCapa(id: string, tenantId: string) {
    const capa = await this.prisma.capaMapa.findFirst({
      where: { id, tenant_id: tenantId },
      include: { creador: { select: { id: true, nombre: true } } },
    });
    if (!capa) throw new NotFoundException('Capa no encontrada');
    return capa;
  }

  async createCapa(data: any, tenantId: string, userId?: string) {
    const payload = this.normalizarCapa(data, tenantId, userId);
    try {
      return await this.prisma.capaMapa.create({
        data: payload,
        include: { creador: { select: { id: true, nombre: true } } },
      });
    } catch (err: any) {
      console.error('[MapasService.createCapa] ERROR:', err?.message, err?.code);
      throw err;
    }
  }

  async updateCapa(id: string, data: any, tenantId: string) {
    await this.findOneCapa(id, tenantId);
    const payload = this.normalizarCapa(data, tenantId, undefined, true);
    return this.prisma.capaMapa.update({
      where: { id },
      data: payload,
      include: { creador: { select: { id: true, nombre: true } } },
    });
  }

  async removeCapa(id: string, tenantId: string) {
    await this.findOneCapa(id, tenantId);
    return this.prisma.capaMapa.delete({ where: { id } });
  }

  // ======================
  // SECCIONES INE
  // ======================
  async findAllSeccionesINE(tenantId: string, estadoId?: number, municipioId?: number) {
    const where: any = { tenant_id: tenantId };
    if (estadoId != null) where.estado_id = estadoId;
    if (municipioId != null) where.municipio_id = municipioId;
    return this.prisma.seccionINE.findMany({
      where,
      orderBy: [{ municipio: 'asc' }, { seccion: 'asc' }],
    });
  }

  async importarSeccionesINE(
    tenantId: string,
    userId: string | undefined,
    geojson: any,
    metadata: { nombre: string; color: string; estado_id: number; estado: string; municipio_id?: number; municipio?: string; anio?: number },
  ) {
    const metaMunicipioId = this.parsearEntero(metadata.municipio_id, undefined as any);
    const metaMunicipioNombre = metadata.municipio?.trim() || undefined;
    if (!geojson || !Array.isArray(geojson.features)) {
      throw new BadRequestException('El archivo no contiene un GeoJSON FeatureCollection válido');
    }

    const features = geojson.features.filter((f: any) => f?.geometry);
    if (features.length === 0) {
      throw new BadRequestException('No se encontraron geometrías válidas en el archivo');
    }

    const secciones: any[] = [];
    const collectionFeatures: any[] = [];

    for (const feature of features) {
      const props = feature.properties || {};
      const seccion = this.extraerCampo(props, ['seccion', 'SECCION', 'SECC', 'secc', 'sección', 'Seccion']);
      if (!seccion) continue;

      const estado = metadata.estado || this.extraerCampo(props, ['estado', 'ESTADO', 'NOM_ENT', 'nom_ent', 'entidad']);
      const municipioIdRaw = this.extraerCampo(props, ['municipio_id', 'MUNICIPIO_ID', 'MUNICIPIO', 'MUN', 'CVE_MUN', 'cve_mun', 'MUN_ID']);
      const municipioIdNum = this.parsearEntero(municipioIdRaw, undefined as any);
      const municipioId = municipioIdNum ?? metaMunicipioId ?? 0;

      const municipioNombreRaw = this.extraerCampo(props, ['NOM_MUN', 'nom_mun', 'municipio', 'MUNICIPIO', 'municip']);
      const municipio = municipioNombreRaw || metaMunicipioNombre || (municipioId ? `Municipio ${municipioId}` : 'Sin municipio');
      const distritoFederal = this.parsearEntero(this.extraerCampo(props, ['distrito_federal', 'DISTRITO_F', 'DF', 'distrito_f', 'distritof']));
      const distritoLocal = this.parsearEntero(this.extraerCampo(props, ['distrito_local', 'DISTRITO_L', 'DL', 'distrito_l', 'distritol']));
      const padron = this.parsearEntero(this.extraerCampo(props, ['padron_2024', 'PADRON', 'padron', 'PADRON_2024']));
      const listaNominal = this.parsearEntero(this.extraerCampo(props, ['lista_nominal_2024', 'LISTA_N', 'LISTA_NOMINAL', 'lista_n', 'lista_nominal']));

      // Normalizar geometría a MultiPolygon
      const geom = this.normalizarAMultiPolygon(feature.geometry);

      secciones.push({
        tenant_id: tenantId,
        seccion: String(seccion).padStart(4, '0').slice(0, 4),
        estado,
        estado_id: metadata.estado_id,
        municipio,
        municipio_id: municipioId,
        distrito_federal: distritoFederal,
        distrito_local: distritoLocal,
        padron_2024: padron,
        lista_nominal_2024: listaNominal,
        coordenadas: geom,
      });

      collectionFeatures.push({
        type: 'Feature',
        geometry: geom,
        properties: {
          ...props,
          seccion: String(seccion).padStart(4, '0').slice(0, 4),
          estado,
          municipio,
          estado_id: metadata.estado_id,
          municipio_id: municipioId,
          distrito_federal: distritoFederal,
          distrito_local: distritoLocal,
          padron_2024: padron,
          lista_nominal_2024: listaNominal,
        },
      });
    }

    if (secciones.length === 0) {
      throw new BadRequestException('No se pudieron identificar secciones electorales en el archivo. Verifica que las propiedades incluyan un campo de sección.');
    }

    // Upsert masivo en SeccionINE por (tenant_id, estado_id, municipio_id, seccion)
    const chunkSize = 500;
    for (let i = 0; i < secciones.length; i += chunkSize) {
      const chunk = secciones.slice(i, i + chunkSize);
      const values: any[] = [];
      const placeholders: string[] = [];
      let idx = 1;
      for (const s of chunk) {
        placeholders.push(
          `($${idx++}::uuid, $${idx++}::uuid, $${idx++}::varchar(4), $${idx++}::text, $${idx++}::int, $${idx++}::text, $${idx++}::int, $${idx++}::int, $${idx++}::int, $${idx++}::int, $${idx++}::int, $${idx++}::jsonb)`,
        );
        values.push(
          randomUUID(),
          s.tenant_id,
          s.seccion,
          s.estado,
          s.estado_id,
          s.municipio,
          s.municipio_id,
          s.distrito_federal ?? null,
          s.distrito_local ?? null,
          s.padron_2024 ?? null,
          s.lista_nominal_2024 ?? null,
          s.coordenadas,
        );
      }
      const query = `
        INSERT INTO secciones_ine (
          id, tenant_id, seccion, estado, estado_id, municipio, municipio_id,
          distrito_federal, distrito_local, padron_2024, lista_nominal_2024, coordenadas
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (tenant_id, estado_id, municipio_id, seccion)
        DO UPDATE SET
          estado = EXCLUDED.estado,
          municipio = EXCLUDED.municipio,
          distrito_federal = EXCLUDED.distrito_federal,
          distrito_local = EXCLUDED.distrito_local,
          padron_2024 = EXCLUDED.padron_2024,
          lista_nominal_2024 = EXCLUDED.lista_nominal_2024,
          coordenadas = EXCLUDED.coordenadas
      `;
      await this.prisma.$queryRawUnsafe(query, ...values);
    }

    const capaPayload = {
      nombre: metadata.nombre || `Secciones INE ${metadata.estado || metadata.estado_id}`,
      tipo: 'secciones_ine',
      origen: 'externa',
      color: metadata.color || '#9CA3AF',
      visible: true,
      geojson: { type: 'FeatureCollection', features: collectionFeatures },
      metadata: {
        estado_id: metadata.estado_id,
        estado: metadata.estado,
        municipio_id: metadata.municipio_id,
        municipio: metadata.municipio,
        anio: metadata.anio || 2024,
        total_secciones: collectionFeatures.length,
        tipo_archivo: 'ine_secciones',
      },
    };

    const capaExistente = await this.prisma.capaMapa.findFirst({
      where: {
        tenant_id: tenantId,
        tipo: 'secciones_ine',
        metadata: { path: ['estado_id'], equals: metadata.estado_id },
      },
    });

    const capa = capaExistente
      ? await this.updateCapa(capaExistente.id, capaPayload, tenantId)
      : await this.createCapa(capaPayload, tenantId, userId);

    return { capa, total_secciones: collectionFeatures.length };
  }

  // ======================
  // IMPORTAR EXCEL DE SECCIONES CON DATOS DE CAMPAÑA
  // ======================
  async importarSeccionesExcel(
    tenantId: string,
    buffer: Buffer,
    opts: { estado_id?: number; estado?: string },
  ) {
    const rows = this.leerExcel(buffer);
    if (rows.length === 0) {
      throw new BadRequestException('El archivo Excel no contiene filas de datos');
    }

    // Determinar estado_id global (body o columna del Excel)
    let estadoIdGlobal = opts.estado_id;
    if (!estadoIdGlobal) {
      for (const r of rows.slice(0, 100)) {
        const id = this.parsearEntero(
          this.extraerCampo(r, ['estado_id', 'cve_ent', 'id_estado', 'clave_estado']),
          undefined as any,
        );
        if (id) {
          estadoIdGlobal = id;
          break;
        }
      }
    }
    if (!estadoIdGlobal) {
      throw new BadRequestException(
        'No se pudo determinar el estado_id. Inclúyelo en el Excel (columna estado_id) o envíalo como parámetro.',
      );
    }

    const estadoGlobal =
      opts.estado ||
      this.extraerCampo(rows[0], ['estado', 'nom_ent', 'nombre_estado']) ||
      'Sin estado';

    const filasNormalizadas = rows
      .map((r) => this.normalizarFilaExcel(r, estadoIdGlobal, estadoGlobal))
      .filter((f) => !!f.seccion);

    if (filasNormalizadas.length === 0) {
      throw new BadRequestException('No se encontraron filas con número de sección válido');
    }

    // Resolver municipio_id por nombre si no viene en el Excel
    const municipiosPendientes = new Set<string>();
    filasNormalizadas.forEach((f) => {
      if (!f.municipio_id && f.municipio) {
        municipiosPendientes.add(f.municipio);
      }
    });

    const municipioMap = new Map<string, number>();
    if (municipiosPendientes.size > 0) {
      const munRows = await this.prisma.seccionINE.findMany({
        where: {
          tenant_id: tenantId,
          estado_id: estadoIdGlobal,
          municipio: { in: Array.from(municipiosPendientes), mode: 'insensitive' },
        },
        distinct: ['municipio_id', 'municipio'],
        select: { municipio_id: true, municipio: true },
      });
      munRows.forEach((m) => {
        if (m.municipio != null) {
          const key = this.normalizarTexto(m.municipio);
          municipioMap.set(key, m.municipio_id);
        }
      });
    }

    const validas = filasNormalizadas.filter((f) => {
      if (!f.municipio_id && f.municipio) {
        f.municipio_id = municipioMap.get(this.normalizarTexto(f.municipio));
      }
      return !!f.municipio_id;
    });

    const omitidas = filasNormalizadas.length - validas.length;

    // Obtener IDs de secciones existentes para actualizarlas
    const seccionesSet = new Set(validas.map((f) => f.seccion));
    const existentes = await this.prisma.seccionINE.findMany({
      where: {
        tenant_id: tenantId,
        estado_id: estadoIdGlobal,
        seccion: { in: Array.from(seccionesSet) },
      },
      select: { id: true, seccion: true, municipio_id: true, estado_id: true, municipio: true },
    });

    const existentesMap = new Map(
      existentes.map((s) => [`${s.estado_id}|${s.municipio_id}|${s.seccion}`, s]),
    );

    const actualizables: Array<{ id: string; fila: any }> = [];
    const nuevas: any[] = [];

    validas.forEach((f) => {
      const key = `${estadoIdGlobal}|${f.municipio_id}|${f.seccion}`;
      const existente = existentesMap.get(key);
      if (existente) {
        actualizables.push({ id: existente.id, fila: f });
      } else {
        nuevas.push(f);
      }
    });

    // 1) Actualizar existentes por ID
    if (actualizables.length > 0) {
      await this.bulkUpdateSeccionesINE(tenantId, actualizables, estadoGlobal);
    }

    // 2) Crear nuevas (sin geometría; se mostrarán cuando se importe el shapefile)
    if (nuevas.length > 0) {
      await this.bulkInsertSeccionesINE(tenantId, nuevas, estadoIdGlobal, estadoGlobal);
    }

    // 3) Upsert resultados históricos
    const historicos: any[] = [];
    validas.forEach((f) => {
      [2024, 2021, 2018].forEach((anio) => {
        const h = f.historicos[anio];
        if (!h) return;
        if (
          h.partido_ganador == null &&
          h.votos_ganador == null &&
          h.votos_totales == null &&
          h.participacion_pct == null &&
          h.votos_nulos == null
        ) {
          return;
        }
        historicos.push({
          seccion: f.seccion,
          anio,
          estado_id: estadoIdGlobal,
          municipio_id: f.municipio_id,
          ...h,
        });
      });
    });

    if (historicos.length > 0) {
      await this.bulkUpsertResultadosHistoricos(tenantId, historicos);
    }

    return {
      total_filas: rows.length,
      importadas: validas.length,
      actualizadas: actualizables.length,
      nuevas: nuevas.length,
      historicos: historicos.length,
      omitidas,
    };
  }

  private leerExcel(buffer: Buffer): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    if (!workbook.SheetNames.length) {
      throw new BadRequestException('El archivo Excel no tiene hojas');
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false }) as any[];
    return raw.map((r) => this.normalizarKeys(r));
  }

  private normalizarKeys(obj: any): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k == null) continue;
      const key = String(k)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      out[key] = v;
    }
    return out;
  }

  private normalizarTexto(texto?: string | null): string {
    if (texto == null) return '';
    return String(texto)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  private normalizarFilaExcel(fila: Record<string, any>, estadoId: number, estadoDefault: string) {
    const seccionRaw = this.extraerCampo(fila, [
      'seccion', 'secc', 'seccion_electoral', 'secc_electoral', 'seccion_ine', 'seccion_elec',
    ]);
    const seccion = seccionRaw ? String(seccionRaw).padStart(4, '0').slice(0, 4) : '';

    const municipioNombre =
      this.extraerCampo(fila, ['municipio', 'nom_mun', 'municipio_nombre', 'municipio_nomb']) || undefined;
    const municipioId = this.parsearEntero(
      this.extraerCampo(fila, ['municipio_id', 'cve_mun', 'id_municipio', 'clave_municipio', 'municipio_clave']),
      undefined as any,
    );

    const nombre =
      this.extraerCampo(fila, [
        'nombre', 'nombre_seccion', 'nombre_de_la_seccion', 'alias', 'seccion_nombre',
      ]) || undefined;

    const colorRaw = this.extraerCampo(fila, ['color', 'color_seccion', 'hex_color']);
    const color = colorRaw && this.esColorValido(colorRaw) ? colorRaw : undefined;

    const distritoFederal = this.parsearEntero(
      this.extraerCampo(fila, ['distrito_federal', 'distritof', 'distrito_f', 'df']),
      undefined as any,
    );
    const distritoLocal = this.parsearEntero(
      this.extraerCampo(fila, ['distrito_local', 'distritol', 'distrito_l', 'dl']),
      undefined as any,
    );

    const padron2024 = this.parsearEntero(
      this.extraerCampo(fila, ['padron_2024', 'padron', 'electores', 'padron_electoral']),
      undefined as any,
    );
    const listaNominal2024 = this.parsearEntero(
      this.extraerCampo(fila, ['lista_nominal_2024', 'lista_nominal', 'ln', 'lista']),
      undefined as any,
    );
    const casillasTotal = this.parsearEntero(
      this.extraerCampo(fila, ['casillas_total', 'casillas', 'total_casillas', 'numero_casillas']),
      undefined as any,
    );
    const meta = this.extraerCampo(fila, ['meta', 'prioridad', 'meta_votos']) || undefined;
    const observaciones = this.extraerCampo(fila, ['observaciones', 'notas', 'obs', 'comentarios']) || undefined;

    const historicos: Record<number, any> = {};
    for (const anio of [2024, 2021, 2018]) {
      const sufijo = String(anio).slice(2);
      historicos[anio] = {
        partido_ganador:
          this.extraerCampo(fila, [
            `ganador_${anio}`,
            `partido_ganador_${anio}`,
            `ganador_${sufijo}`,
            `partido_${anio}`,
            `partido_${sufijo}`,
          ]) || undefined,
        votos_ganador: this.parsearEntero(
          this.extraerCampo(fila, [
            `votos_ganador_${anio}`,
            `votos_ganador_${sufijo}`,
            `votos_ganador`,
          ]),
          undefined as any,
        ),
        votos_totales: this.parsearEntero(
          this.extraerCampo(fila, [
            `votos_totales_${anio}`,
            `votos_totales_${sufijo}`,
            `total_votos_${anio}`,
            `total_votos_${sufijo}`,
          ]),
          undefined as any,
        ),
        participacion_pct: this.parsearFloat(
          this.extraerCampo(fila, [
            `participacion_${anio}`,
            `participacion_${sufijo}`,
            `participacion_pct_${anio}`,
            `participacion_pct_${sufijo}`,
            `participacion`,
          ]),
          undefined as any,
        ),
        votos_nulos: this.parsearEntero(
          this.extraerCampo(fila, [
            `votos_nulos_${anio}`,
            `votos_nulos_${sufijo}`,
            `nulos_${anio}`,
            `nulos_${sufijo}`,
          ]),
          undefined as any,
        ),
      };
    }

    return {
      seccion,
      nombre,
      estado: estadoDefault,
      estado_id: estadoId,
      municipio: municipioNombre,
      municipio_id: municipioId,
      distrito_federal: distritoFederal,
      distrito_local: distritoLocal,
      padron_2024: padron2024,
      lista_nominal_2024: listaNominal2024,
      casillas_total: casillasTotal,
      meta,
      observaciones,
      color,
      historicos,
    };
  }

  private esColorValido(value: string): boolean {
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(String(value).trim());
  }

  private parsearFloat<T extends number | undefined = number>(value: any, defaultValue: T = 0 as T): T | number {
    if (value === null || value === undefined || value === '') return defaultValue;
    const s = String(value).replace('%', '').replace(',', '').trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : defaultValue;
  }

  private async bulkUpdateSeccionesINE(
    tenantId: string,
    actualizables: Array<{ id: string; fila: any }>,
    estadoDefault: string,
  ) {
    // Preparar arrays para UPDATE ... FROM unnest
    const ids: string[] = [];
    const nombres: (string | null)[] = [];
    const municipios: (string | null)[] = [];
    const distritosFed: (number | null)[] = [];
    const distritosLoc: (number | null)[] = [];
    const padrones: (number | null)[] = [];
    const listas: (number | null)[] = [];
    const casillas: (number | null)[] = [];
    const metas: (string | null)[] = [];
    const observs: (string | null)[] = [];
    const colores: (string | null)[] = [];

    actualizables.forEach(({ id, fila }) => {
      ids.push(id);
      nombres.push(fila.nombre ?? null);
      municipios.push(fila.municipio ?? null);
      distritosFed.push(fila.distrito_federal ?? null);
      distritosLoc.push(fila.distrito_local ?? null);
      padrones.push(fila.padron_2024 ?? null);
      listas.push(fila.lista_nominal_2024 ?? null);
      casillas.push(fila.casillas_total ?? null);
      metas.push(fila.meta ?? null);
      observs.push(fila.observaciones ?? null);
      colores.push(fila.color ?? null);
    });

    await this.prisma.$queryRawUnsafe(
      `UPDATE secciones_ine AS target
       SET
         nombre = COALESCE(data.nombre, target.nombre),
         municipio = COALESCE(data.municipio, target.municipio),
         distrito_federal = COALESCE(data.distrito_federal, target.distrito_federal),
         distrito_local = COALESCE(data.distrito_local, target.distrito_local),
         padron_2024 = COALESCE(data.padron_2024, target.padron_2024),
         lista_nominal_2024 = COALESCE(data.lista_nominal_2024, target.lista_nominal_2024),
         casillas_total = COALESCE(data.casillas_total, target.casillas_total),
         meta = COALESCE(data.meta, target.meta),
         observaciones = COALESCE(data.observaciones, target.observaciones),
         color = COALESCE(data.color, target.color)
       FROM (
         SELECT
           unnest($1::uuid[]) AS id,
           unnest($2::text[]) AS nombre,
           unnest($3::text[]) AS municipio,
           unnest($4::int[]) AS distrito_federal,
           unnest($5::int[]) AS distrito_local,
           unnest($6::int[]) AS padron_2024,
           unnest($7::int[]) AS lista_nominal_2024,
           unnest($8::int[]) AS casillas_total,
           unnest($9::text[]) AS meta,
           unnest($10::text[]) AS observaciones,
           unnest($11::text[]) AS color
       ) AS data
       WHERE target.id = data.id AND target.tenant_id = $12::uuid`,
      ids,
      nombres,
      municipios,
      distritosFed,
      distritosLoc,
      padrones,
      listas,
      casillas,
      metas,
      observs,
      colores,
      tenantId,
    );
  }

  private async bulkInsertSeccionesINE(
    tenantId: string,
    nuevas: any[],
    estadoId: number,
    estadoNombre: string,
  ) {
    const chunkSize = 500;
    for (let i = 0; i < nuevas.length; i += chunkSize) {
      const chunk = nuevas.slice(i, i + chunkSize);
      const values: any[] = [];
      const placeholders: string[] = [];
      let idx = 1;
      for (const f of chunk) {
        placeholders.push(
          `($${idx++}::uuid, $${idx++}::uuid, $${idx++}::varchar(4), $${idx++}::text, $${idx++}::text, $${idx++}::int, $${idx++}::text, $${idx++}::int, $${idx++}::int, $${idx++}::int, $${idx++}::int, $${idx++}::int, $${idx++}::int, $${idx++}::text, $${idx++}::text, $${idx++}::text, $${idx++}::jsonb)`,
        );
        values.push(
          randomUUID(),
          tenantId,
          f.seccion,
          f.nombre ?? null,
          estadoNombre,
          estadoId,
          f.municipio ?? 'Sin municipio',
          f.municipio_id,
          f.distrito_federal ?? null,
          f.distrito_local ?? null,
          f.padron_2024 ?? null,
          f.lista_nominal_2024 ?? null,
          f.casillas_total ?? null,
          f.meta ?? null,
          f.observaciones ?? null,
          f.color ?? null,
          null, // coordenadas
        );
      }

      const query = `
        INSERT INTO secciones_ine (
          id, tenant_id, seccion, nombre, estado, estado_id, municipio, municipio_id,
          distrito_federal, distrito_local, padron_2024, lista_nominal_2024,
          casillas_total, meta, observaciones, color, coordenadas
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (tenant_id, estado_id, municipio_id, seccion)
        DO UPDATE SET
          nombre = COALESCE(EXCLUDED.nombre, secciones_ine.nombre),
          estado = COALESCE(EXCLUDED.estado, secciones_ine.estado),
          municipio = COALESCE(EXCLUDED.municipio, secciones_ine.municipio),
          distrito_federal = COALESCE(EXCLUDED.distrito_federal, secciones_ine.distrito_federal),
          distrito_local = COALESCE(EXCLUDED.distrito_local, secciones_ine.distrito_local),
          padron_2024 = COALESCE(EXCLUDED.padron_2024, secciones_ine.padron_2024),
          lista_nominal_2024 = COALESCE(EXCLUDED.lista_nominal_2024, secciones_ine.lista_nominal_2024),
          casillas_total = COALESCE(EXCLUDED.casillas_total, secciones_ine.casillas_total),
          meta = COALESCE(EXCLUDED.meta, secciones_ine.meta),
          observaciones = COALESCE(EXCLUDED.observaciones, secciones_ine.observaciones),
          color = COALESCE(EXCLUDED.color, secciones_ine.color)
      `;
      await this.prisma.$queryRawUnsafe(query, ...values);
    }
  }

  private async bulkUpsertResultadosHistoricos(tenantId: string, historicos: any[]) {
    const chunkSize = 500;
    for (let i = 0; i < historicos.length; i += chunkSize) {
      const chunk = historicos.slice(i, i + chunkSize);
      const values: any[] = [];
      const placeholders: string[] = [];
      let idx = 1;
      for (const h of chunk) {
        placeholders.push(
          `($${idx++}, $${idx++}::uuid, $${idx++}::varchar(4), $${idx++}::int, $${idx++}::int, $${idx++}::int, $${idx++}::text, $${idx++}::int, $${idx++}::int, $${idx++}::int, $${idx++}::real)`,
        );
        values.push(
          tenantId,
          h.seccion,
          h.anio,
          h.estado_id ?? null,
          h.municipio_id ?? null,
          h.partido_ganador ?? null,
          h.votos_ganador ?? null,
          h.votos_totales ?? null,
          h.votos_nulos ?? null,
          h.participacion_pct ?? null,
        );
      }

      const query = `
        INSERT INTO resultados_historicos (
          tenant_id, seccion, anio, estado_id, municipio_id,
          partido_ganador, votos_ganador, votos_totales, votos_nulos, participacion_pct
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (tenant_id, seccion, anio)
        DO UPDATE SET
          estado_id = COALESCE(EXCLUDED.estado_id, resultados_historicos.estado_id),
          municipio_id = COALESCE(EXCLUDED.municipio_id, resultados_historicos.municipio_id),
          partido_ganador = COALESCE(EXCLUDED.partido_ganador, resultados_historicos.partido_ganador),
          votos_ganador = COALESCE(EXCLUDED.votos_ganador, resultados_historicos.votos_ganador),
          votos_totales = COALESCE(EXCLUDED.votos_totales, resultados_historicos.votos_totales),
          votos_nulos = COALESCE(EXCLUDED.votos_nulos, resultados_historicos.votos_nulos),
          participacion_pct = COALESCE(EXCLUDED.participacion_pct, resultados_historicos.participacion_pct)
      `;
      await this.prisma.$queryRawUnsafe(query, ...values);
    }
  }

  private extraerCampo(props: Record<string, any>, candidatos: string[]): string | undefined {
    for (const key of candidatos) {
      if (props[key] != null && String(props[key]).trim() !== '') {
        return String(props[key]).trim();
      }
    }
    return undefined;
  }

  private normalizarAMultiPolygon(geometry: any): any {
    if (!geometry || !geometry.type) return geometry;
    if (geometry.type === 'MultiPolygon') return geometry;
    if (geometry.type === 'Polygon') {
      return { type: 'MultiPolygon', coordinates: [geometry.coordinates] };
    }
    return geometry;
  }

  private normalizarCapa(data: any, tenantId: string, userId?: string, esUpdate = false) {
    const payload: any = {};

    if (!esUpdate) {
      payload.tenant_id = tenantId;
      if (userId) payload.created_by = userId;
    }

    if (data.nombre !== undefined) payload.nombre = String(data.nombre).trim();
    if (data.tipo !== undefined) {
      const tipo = String(data.tipo).trim().toLowerCase();
      if (!TIPOS_CAPA.includes(tipo)) {
        throw new BadRequestException(`Tipo de capa inválido: ${tipo}`);
      }
      payload.tipo = tipo;
    }
    if (data.origen !== undefined) {
      const origen = String(data.origen).trim().toLowerCase();
      if (!ORIGENES_CAPA.includes(origen)) {
        throw new BadRequestException(`Origen de capa inválido: ${origen}`);
      }
      payload.origen = origen;
    }
    if (data.color !== undefined) payload.color = String(data.color).trim();
    if (data.visible !== undefined) payload.visible = Boolean(data.visible);
    if (data.orden !== undefined) payload.orden = this.parsearEntero(data.orden, 0);

    if (data.geojson !== undefined) {
      if (data.geojson === null) {
        payload.geojson = null;
      } else {
        this.validarGeoJson(data.geojson);
        payload.geojson = data.geojson;
      }
    }

    if (data.metadata !== undefined) {
      payload.metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
    }

    return payload;
  }

  private validarGeoJson(geojson: any) {
    if (!geojson || typeof geojson !== 'object') {
      throw new BadRequestException('geojson debe ser un objeto');
    }
    const validTypes = ['FeatureCollection', 'Feature', 'Polygon', 'MultiPolygon', 'Point', 'MultiPoint', 'LineString', 'MultiLineString'];
    if (!validTypes.includes(geojson.type)) {
      throw new BadRequestException(`Tipo de GeoJSON no soportado: ${geojson.type}`);
    }
    if (geojson.type === 'FeatureCollection' && !Array.isArray(geojson.features)) {
      throw new BadRequestException('FeatureCollection requiere un array features');
    }
  }

  private parsearEntero<T extends number | undefined = number>(value: any, defaultValue: T = 0 as T): T | number {
    if (value === null || value === undefined || value === '') return defaultValue;
    const n = Number(value);
    return Number.isFinite(n) && Number.isInteger(n) ? n : defaultValue;
  }

  private puntoDesde(coordenadas: any): [number, number] | null {
    const c = coordenadas as any;
    if (!c || typeof c.lng !== 'number' || typeof c.lat !== 'number') return null;
    return [c.lng, c.lat];
  }

  // ======================
  // GEOJSON POR CAPAS
  // ======================
  async geojson(tenantId: string, capasSolicitadas: string[], query: any) {
    const capasDisponibles = new Set([...CAPAS_PREDEFINIDAS.map(c => c.id), ...CAPAS_PREDEFINIDAS.map(c => c.tipo)]);
    const personalizadas = await this.prisma.capaMapa.findMany({
      where: { tenant_id: tenantId, visible: true },
      select: { id: true, tipo: true },
    });
    personalizadas.forEach(c => capasDisponibles.add(c.id));

    const capas = capasSolicitadas.length
      ? capasSolicitadas.filter(c => capasDisponibles.has(c))
      : CAPAS_PREDEFINIDAS.map(c => c.id);

    const resultado: Record<string, any> = {};

    for (const capa of capas) {
      switch (capa) {
        case 'zonas':
        case 'territorio':
          resultado.zonas = await this.geojsonZonas(tenantId);
          break;
        case 'secciones_ine':
          resultado.secciones_ine = await this.geojsonSeccionesINE(tenantId);
          break;
        case 'lideres':
          resultado.lideres = await this.geojsonLideres(tenantId);
          break;
        case 'votantes':
          resultado.votantes = await this.geojsonVotantes(tenantId, query);
          break;
        case 'apoyos':
          resultado.apoyos = await this.geojsonApoyos(tenantId, query);
          break;
        case 'peticiones':
          resultado.peticiones = await this.geojsonPeticiones(tenantId, query);
          break;
        case 'eventos':
          resultado.eventos = await this.geojsonEventos(tenantId);
          break;
        case 'recorridos':
          resultado.recorridos = await this.geojsonRecorridos(tenantId);
          break;
        default:
          // Capa personalizada
          const custom = await this.geojsonCapaPersonalizada(tenantId, capa);
          if (custom) resultado[capa] = custom;
      }
    }

    return resultado;
  }

  private async geojsonZonas(tenantId: string) {
    const zonas = await this.prisma.zona.findMany({
      where: { tenant_id: tenantId },
      include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });

    const stats = await this.estadisticasPorZona(tenantId);

    const features = zonas
      .filter(z => z.coordenadas)
      .map(z => {
        const st = stats.find(s => s.zona_id === z.id) || {};
        return {
          type: 'Feature',
          geometry: z.coordenadas,
          properties: {
            id: z.id,
            nombre: z.nombre,
            tipo: z.tipo,
            color: z.color,
            secciones: z.secciones || [],
            lider_id: z.lider_id,
            lider_nombre: z.lider?.votante?.nombre || null,
            meta_votos: z.meta_votos,
            votos_estimados: z.votos_estimados,
            descripcion: z.descripcion,
            activa: z.activa,
            votantes_count: st.votantes || 0,
            apoyos_count: st.apoyos || 0,
            lideres_count: st.lideres || 0,
            eventos_count: st.eventos || 0,
          },
        };
      });

    return { type: 'FeatureCollection', features };
  }

  private async geojsonSeccionesINE(tenantId: string, query: any = {}) {
    const baseWhere: any = { tenant_id: tenantId };

    // Si se pide todo=true, mostrar secciones del municipio de León
    if (query.todo === 'true') {
      const secciones = await this.prisma.seccionINE.findMany({
        where: { ...baseWhere, municipio_id: 20 },
      });
      return this.formatearSecciones(tenantId, secciones);
    }

    const set = new Set<string>();

    // Solo secciones referenciadas por zonas o votantes del tenant
    const [seccionesZonas, seccionesVotantes] = await Promise.all([
      this.prisma.zona.findMany({ where: { tenant_id: tenantId }, select: { secciones: true } }),
      this.prisma.votante.findMany({ where: { tenant_id: tenantId, seccion_electoral: { not: null } }, select: { seccion_electoral: true } }),
    ]);

    seccionesZonas.forEach(z => z.secciones?.forEach(s => set.add(s)));
    seccionesVotantes.forEach(v => v.seccion_electoral && set.add(v.seccion_electoral));

    if (set.size === 0) {
      // Fallback: mostrar secciones de León si no hay datos del tenant
      const secciones = await this.prisma.seccionINE.findMany({
        where: { ...baseWhere, municipio_id: 20 },
      });
      return this.formatearSecciones(tenantId, secciones);
    }

    const secciones = await this.prisma.seccionINE.findMany({
      where: { ...baseWhere, seccion: { in: Array.from(set) } },
    });

    return this.formatearSecciones(tenantId, secciones);
  }

  private async formatearSecciones(tenantId: string, secciones: any[]) {
    if (secciones.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }

    const seccionIds = secciones.map((s) => s.seccion);

    const [resultadosHistoricos, casillasCount] = await Promise.all([
      this.prisma.resultadoHistorico.findMany({
        where: { tenant_id: tenantId, seccion: { in: seccionIds } },
        orderBy: { anio: 'desc' },
      }).catch((e: any) => {
        console.error('[formatearSecciones] resultadosHistoricos error:', e?.message);
        return [];
      }),
      this.prisma.casilla.groupBy({
        by: ['seccion'],
        where: { tenant_id: tenantId, seccion: { in: seccionIds } },
        _count: { id: true },
      }).catch((e: any) => {
        console.error('[formatearSecciones] casillasCount error:', e?.message);
        return [];
      }),
    ]);

    const resultadosPorSeccion: Record<string, any> = {};
    resultadosHistoricos.forEach((r: any) => {
      if (!resultadosPorSeccion[r.seccion]) resultadosPorSeccion[r.seccion] = {};
      resultadosPorSeccion[r.seccion][r.anio] = r;
    });

    const casillasPorSeccion: Record<string, number> = {};
    casillasCount.forEach((c: any) => {
      casillasPorSeccion[c.seccion] = c._count?.id ?? 0;
    });

    const features = secciones
      .filter(s => s.coordenadas)
      .map(s => {
        const historicos = resultadosPorSeccion[s.seccion] || {};
        const ultimo = historicos[2024] || historicos[2021] || historicos[2018] || null;
        return {
          type: 'Feature',
          geometry: s.coordenadas,
          properties: {
            id: s.seccion,
            seccion: s.seccion,
            nombre: s.nombre || `Sección ${s.seccion}`,
            estado: s.estado,
            municipio: s.municipio,
            distrito_federal: s.distrito_federal,
            distrito_local: s.distrito_local,
            padron_2024: s.padron_2024,
            lista_nominal_2024: s.lista_nominal_2024,
            casillas_total: s.casillas_total,
            casillas_count: casillasPorSeccion[s.seccion] || 0,
            meta: s.meta,
            observaciones: s.observaciones,
            color: s.color,
            resultado_2024: historicos[2024] || null,
            resultado_2021: historicos[2021] || null,
            resultado_2018: historicos[2018] || null,
            resultado_ultimo: ultimo,
          },
        };
      });

    return { type: 'FeatureCollection', features };
  }

  private async geojsonLideres(tenantId: string) {
    const lideres = await this.prisma.lider.findMany({
      where: { tenant_id: tenantId, activo: true },
      include: { votante: true },
    });

    const features = lideres
      .map(l => ({ lider: l, coords: this.puntoDesde(l.votante?.coordenadas) }))
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
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  private async geojsonVotantes(tenantId: string, query: any) {
    const limit = Math.min(parseInt(query.limit) || 2000, 10000);
    const votantes = await this.prisma.votante.findMany({
      where: { tenant_id: tenantId, activo: true, coordenadas: { not: null } },
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    const features = votantes
      .map(v => ({ v, coords: this.puntoDesde(v.coordenadas) }))
      .filter(item => item.coords)
      .map(({ v, coords }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          id: v.id,
          nombre: v.nombre,
          telefono: v.telefono,
          seccion_electoral: v.seccion_electoral,
          colonia: v.colonia,
          nivel_apoyo: v.nivel_apoyo,
          es_lider: v.es_lider,
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  private async geojsonApoyos(tenantId: string, query: any) {
    const limit = Math.min(parseInt(query.limit) || 2000, 10000);
    const desde = query.desde ? new Date(query.desde) : undefined;
    const hasta = query.hasta ? new Date(query.hasta) : undefined;

    const where: any = { tenant_id: tenantId, coordenadas: { not: null } };
    if (desde || hasta) {
      where.fecha_entrega = {};
      if (desde) where.fecha_entrega.gte = desde;
      if (hasta) where.fecha_entrega.lte = hasta;
    }

    const apoyos = await this.prisma.apoyo.findMany({
      where,
      take: limit,
      orderBy: { fecha_entrega: 'desc' },
      include: { votante: { select: { id: true, nombre: true, seccion_electoral: true, colonia: true } } },
    });

    const features = apoyos
      .map(a => ({ a, coords: this.puntoDesde(a.coordenadas) }))
      .filter(item => item.coords)
      .map(({ a, coords }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          id: a.id,
          tipo_apoyo: a.tipo_apoyo,
          cantidad: a.cantidad,
          fecha_entrega: a.fecha_entrega,
          entregado_por: a.entregado_por,
          verificado: a.verificado,
          votante_id: a.votante_id,
          votante_nombre: a.votante?.nombre,
          seccion_electoral: a.votante?.seccion_electoral,
          observaciones: a.observaciones,
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  private async geojsonPeticiones(tenantId: string, query: any) {
    const limit = Math.min(parseInt(query.limit) || 2000, 10000);
    const estatus = query.estatus;

    const where: any = { tenant_id: tenantId, coordenadas: { not: null } };
    if (estatus) where.estatus = estatus;

    const peticiones = await this.prisma.peticion.findMany({
      where,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        votante: { select: { id: true, nombre: true, telefono: true } },
        creador: { select: { id: true, nombre: true } },
      },
    });

    const features = peticiones
      .map(p => ({ p, coords: this.puntoDesde(p.coordenadas) }))
      .filter(item => item.coords)
      .map(({ p, coords }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          id: p.id,
          categoria: p.categoria,
          prioridad: p.prioridad,
          estatus: p.estatus,
          titulo: p.titulo,
          descripcion: p.descripcion,
          foto_url: p.foto_url,
          created_at: p.created_at,
          votante_id: p.votante_id,
          votante_nombre: p.votante?.nombre,
          creador_nombre: p.creador?.nombre,
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  private async geojsonEventos(tenantId: string) {
    const eventos = await this.prisma.evento.findMany({
      where: { tenant_id: tenantId },
      orderBy: { fecha_inicio: 'asc' },
    });

    const features = eventos
      .map(e => ({ e, coords: this.puntoDesde(e.coordenadas) }))
      .filter(item => item.coords)
      .map(({ e, coords }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          id: e.id,
          nombre: e.nombre,
          direccion: e.direccion,
          fecha_inicio: e.fecha_inicio,
          fecha_fin: e.fecha_fin,
          status: e.status,
          qr_code: e.qr_code,
          tematica: e.tematica,
          zona_id: e.zona_id,
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  private async geojsonRecorridos(tenantId: string) {
    const recorridos = await this.prisma.recorrido.findMany({
      where: { tenant_id: tenantId },
      orderBy: { fecha: 'desc' },
      include: { usuario: { select: { id: true, nombre: true } } },
    });

    const features = recorridos
      .map(r => {
        const puntos = ((r.coordenadas as any) || [])
          .filter((p: any) => p && typeof p.lng === 'number' && typeof p.lat === 'number')
          .map((p: any) => [p.lng, p.lat]);
        return { r, puntos };
      })
      .filter(item => item.puntos.length >= 2)
      .map(({ r, puntos }) => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: puntos,
        },
        properties: {
          id: r.id,
          usuario_id: r.usuario_id,
          usuario_nombre: r.usuario?.nombre,
          fecha: r.fecha,
          distancia_km: r.distancia_km,
          duracion_min: r.duracion_min,
          secciones: r.secciones,
        },
      }));

    return { type: 'FeatureCollection', features };
  }

  private async geojsonCapaPersonalizada(tenantId: string, capaId: string) {
    const capa = await this.prisma.capaMapa.findFirst({
      where: { id: capaId, tenant_id: tenantId, visible: true },
    });
    if (!capa || !capa.geojson) return undefined;

    const geo = capa.geojson as any;
    const collection = geo?.type === 'FeatureCollection'
      ? geo
      : { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: geo, properties: {} }] };

    const esIne = capa.tipo === 'secciones_ine';
    let datosSecciones: Record<string, any> = {};

    if (esIne) {
      const metadata = (capa.metadata as any) || {};
      const secciones = await this.prisma.seccionINE.findMany({
        where: {
          tenant_id: tenantId,
          estado_id: metadata.estado_id,
          municipio_id: metadata.municipio_id,
        },
      });
      const resultados = await this.prisma.resultadoHistorico.findMany({
        where: {
          seccion: { in: secciones.map(s => s.seccion) },
        },
        orderBy: { anio: 'desc' },
      });
      const resultadosPorSeccion: Record<string, any> = {};
      resultados.forEach(r => {
        if (!resultadosPorSeccion[r.seccion]) resultadosPorSeccion[r.seccion] = r;
      });

      secciones.forEach(s => {
        datosSecciones[s.seccion] = {
          ...s,
          resultado_historico: resultadosPorSeccion[s.seccion] || null,
        };
      });
    }

    // Inyectar propiedades de la capa en cada feature
    const features = (collection.features || []).map((f: any) => {
      const props = f.properties || {};
      const extra: Record<string, any> = {
        capa_id: capa.id,
        capa_nombre: capa.nombre,
        capa_tipo: capa.tipo,
        capa_origen: capa.origen,
        color: capa.color,
      };

      if (esIne) {
        const info = datosSecciones[props.seccion];
        if (info) {
          extra.padron_2024 = info.padron_2024;
          extra.lista_nominal_2024 = info.lista_nominal_2024;
          extra.distrito_federal = info.distrito_federal;
          extra.distrito_local = info.distrito_local;
          extra.estado = info.estado;
          extra.municipio = info.municipio;
          extra.resultado_historico = info.resultado_historico;
        }
      }

      return {
        ...f,
        properties: { ...props, ...extra },
      };
    });

    return { type: 'FeatureCollection', features };
  }

  // ======================
  // ESTADÍSTICAS
  // ======================
  async estadisticas(tenantId: string, nivel: 'seccion' | 'zona' = 'seccion') {
    try {
      if (nivel === 'zona') {
        return await this.estadisticasPorZonaConDetalle(tenantId);
      }
      return await this.estadisticasPorSeccion(tenantId);
    } catch (err: any) {
      console.error('[MapasService.estadisticas] ERROR:', err?.message, err?.stack);
      throw err;
    }
  }

  private async estadisticasPorSeccion(tenantId: string) {
    // Cada query independiente para evitar que un error en una tumbe todo
    const [votantesRaw, apoyosRaw, lideresRaw, eventosRaw, seccionesINE] = await Promise.all([
      this.prisma.votante
        .findMany({
          where: { tenant_id: tenantId, activo: true, seccion_electoral: { not: null } },
          select: { seccion_electoral: true, nivel_apoyo: true },
        })
        .catch((e: any) => { console.error('[estadisticasPorSeccion] votantes error:', e?.message); return []; }),
      this.prisma.apoyo
        .findMany({
          where: { tenant_id: tenantId },
          include: { votante: { select: { seccion_electoral: true } } },
        })
        .catch((e: any) => { console.error('[estadisticasPorSeccion] apoyos error:', e?.message); return []; }),
      this.prisma.lider
        .findMany({
          where: { tenant_id: tenantId, activo: true },
          include: { votante: { select: { seccion_electoral: true } } },
        })
        .catch((e: any) => { console.error('[estadisticasPorSeccion] lideres error:', e?.message); return []; }),
      this.prisma.evento
        .findMany({
          where: { tenant_id: tenantId },
          include: { zona: { select: { secciones: true } } },
        })
        .catch((e: any) => { console.error('[estadisticasPorSeccion] eventos error:', e?.message); return []; }),
      this.prisma.seccionINE
        .findMany({ where: { tenant_id: tenantId } })
        .catch((e: any) => { console.error('[estadisticasPorSeccion] seccionesINE error:', e?.message); return []; }),
    ]);

    const votantes = Array.isArray(votantesRaw) ? votantesRaw : [];
    const apoyos = Array.isArray(apoyosRaw) ? apoyosRaw : [];
    const lideres = Array.isArray(lideresRaw) ? lideresRaw : [];
    const eventos = Array.isArray(eventosRaw) ? eventosRaw : [];

    const seccionInfo: Record<string, { lista_nominal: number; padron: number }> = {};
    seccionesINE.forEach(s => {
      seccionInfo[s.seccion] = {
        lista_nominal: s.lista_nominal_2024 || 1000,
        padron: s.padron_2024 || 900,
      };
    });

    const map: Record<string, any> = {};

    const getOrCreate = (clave: string) => {
      if (!map[clave]) {
        map[clave] = {
          seccion: clave,
          votantes: 0,
          apoyos: 0,
          lideres: 0,
          eventos: 0,
          votos_estimados: 0,
          niveles_apoyo: {},
          lista_nominal: seccionInfo[clave]?.lista_nominal || 1000,
          padron: seccionInfo[clave]?.padron || 900,
        };
      }
      return map[clave];
    };

    votantes.forEach(v => {
      const item = getOrCreate(v.seccion_electoral);
      item.votantes += 1;
      item.votos_estimados += v.nivel_apoyo || 0;
      item.niveles_apoyo[v.nivel_apoyo || 0] = (item.niveles_apoyo[v.nivel_apoyo || 0] || 0) + 1;
    });

    apoyos.forEach(a => {
      if (a.votante?.seccion_electoral) {
        getOrCreate(a.votante.seccion_electoral).apoyos += 1;
      }
    });

    lideres.forEach(l => {
      if (l.votante?.seccion_electoral) {
        getOrCreate(l.votante.seccion_electoral).lideres += 1;
      }
    });

    eventos.forEach(e => {
      (e.zona?.secciones || []).forEach(s => {
        getOrCreate(s).eventos += 1;
      });
    });

    // Calcular color y votos faltantes
    Object.values(map).forEach((item: any) => {
      const meta = Math.ceil(item.lista_nominal * 0.34);
      item.faltan_para_ganar = Math.max(0, meta - item.votos_estimados);
      const ratio = item.votos_estimados / meta;
      if (ratio >= 1) item.color = '#22C55E';
      else if (ratio >= 0.6) item.color = '#FACC15';
      else item.color = '#EF4444';
    });

    return {
      nivel: 'seccion',
      total_items: Object.keys(map).length,
      items: Object.values(map).sort((a: any, b: any) => b.votantes - a.votantes),
    };
  }

  private async estadisticasPorZonaConDetalle(tenantId: string) {
    const zonas = await this.prisma.zona.findMany({
      where: { tenant_id: tenantId },
      include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
    });

    if (zonas.length === 0) {
      return { nivel: 'zona', total_items: 0, items: [] };
    }

    const stats = await this.estadisticasPorZona(tenantId, zonas);

    const items = zonas.map(z => {
      const st = stats.find(s => s.zona_id === z.id) || { votantes: 0, apoyos: 0, lideres: 0, eventos: 0 };
      return {
        clave: z.id,
        nombre: z.nombre,
        tipo: z.tipo,
        color: z.color,
        secciones: z.secciones || [],
        lider_id: z.lider_id,
        lider_nombre: z.lider?.votante?.nombre || null,
        meta_votos: z.meta_votos,
        votos_estimados: z.votos_estimados,
        ...st,
      };
    });

    return { nivel: 'zona', total_items: items.length, items: items.sort((a, b) => b.votantes - a.votantes) };
  }

  async estadisticasPorZona(tenantId: string, zonas?: any[]) {
    const listaZonas = zonas || await this.prisma.zona.findMany({ where: { tenant_id: tenantId }, select: { id: true, secciones: true } });

    const seccionAZona: Record<string, string> = {};
    listaZonas.forEach(z => {
      (z.secciones || []).forEach(s => { seccionAZona[s] = z.id; });
    });

    const seccionesConZona = Object.keys(seccionAZona);
    if (seccionesConZona.length === 0) return [];

    const [votantes, apoyos, lideres, eventos] = await Promise.all([
      this.prisma.votante.findMany({
        where: { tenant_id: tenantId, activo: true, seccion_electoral: { in: seccionesConZona } },
        select: { seccion_electoral: true, nivel_apoyo: true },
      }),
      this.prisma.apoyo.findMany({
        where: { tenant_id: tenantId },
        include: { votante: { select: { seccion_electoral: true } } },
      }),
      this.prisma.lider.findMany({
        where: { tenant_id: tenantId, activo: true },
        include: { votante: { select: { seccion_electoral: true } } },
      }),
      this.prisma.evento.findMany({
        where: { tenant_id: tenantId, zona_id: { in: listaZonas.map(z => z.id) } },
        select: { zona_id: true },
      }),
    ]);

    const map: Record<string, any> = {};
    const getOrCreate = (zonaId: string) => {
      if (!map[zonaId]) map[zonaId] = { zona_id: zonaId, votantes: 0, apoyos: 0, lideres: 0, eventos: 0, votos_estimados: 0 };
      return map[zonaId];
    };

    votantes.forEach(v => {
      const zonaId = seccionAZona[v.seccion_electoral];
      if (!zonaId) return;
      const item = getOrCreate(zonaId);
      item.votantes += 1;
      item.votos_estimados += v.nivel_apoyo || 0;
    });

    apoyos.forEach(a => {
      const zonaId = seccionAZona[a.votante?.seccion_electoral];
      if (!zonaId) return;
      getOrCreate(zonaId).apoyos += 1;
    });

    lideres.forEach(l => {
      const zonaId = seccionAZona[l.votante?.seccion_electoral];
      if (!zonaId) return;
      getOrCreate(zonaId).lideres += 1;
    });

    eventos.forEach(e => {
      if (e.zona_id) getOrCreate(e.zona_id).eventos += 1;
    });

    return Object.values(map);
  }

  // ======================
  // SEED DEMO
  // ======================
  async seedDemo(tenantId: string) {
    // Genera secciones cuadriculadas de León, Gto para demo
    const centro = { lat: 21.125, lng: -101.6858 };
    const size = 0.02;
    const rows = 6;
    const cols = 6;

    const existentes = await this.prisma.seccionINE.count({ where: { tenant_id: tenantId, municipio_id: 20 } });
    if (existentes > 0) {
      return { creadas: 0, message: 'Ya existen secciones de León', total: existentes };
    }

    const batch: any[] = [];
    let idx = 1;
    for (let row = -Math.floor(rows / 2); row <= Math.floor(rows / 2); row++) {
      for (let col = -Math.floor(cols / 2); col <= Math.floor(cols / 2); col++) {
        const lat = centro.lat + row * size;
        const lng = centro.lng + col * size;
        const seccion = String(idx).padStart(4, '0');
        const listaNominal = 800 + Math.floor(Math.random() * 600);
        const padron = Math.floor(listaNominal * 0.95);

        batch.push({
          tenant_id: tenantId,
          seccion,
          estado: 'Guanajuato',
          estado_id: 11,
          municipio: 'León',
          municipio_id: 20,
          padron_2024: padron,
          lista_nominal_2024: listaNominal,
          coordenadas: {
            type: 'Polygon',
            coordinates: [
              [
                [lng, lat],
                [lng + size, lat],
                [lng + size, lat + size],
                [lng, lat + size],
                [lng, lat],
              ],
            ],
          },
        });
        idx++;
      }
    }

    const result = await this.prisma.seccionINE.createMany({ data: batch });

    return {
      creadas: result.count,
      message: `Se crearon ${result.count} secciones demo de León`,
      total: result.count,
    };
  }

  // ======================
  // BÚSQUEDA GLOBAL TERRITORIAL
  // ======================
  async buscarGlobal(tenantId: string, query: string, limit = 15, tipoFiltro = 'todos') {
    const inegi = this.inegiService;
    const nominatim = this.nominatimService;
    if (!inegi || !nominatim) {
      throw new BadRequestException('Servicios de búsqueda externos no configurados');
    }

    const q = (query || '').trim();
    if (q.length < 2) return { resultados: [] };

    const max = Math.min(limit, 50);
    const termino = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const resultados: any[] = [];

    const incluir = (grupo: string) => tipoFiltro === 'todos' || tipoFiltro === grupo;

    const promesas: Promise<any[]>[] = [];

    if (incluir('ine')) {
      promesas.push(
        this.prisma.seccionINE
          .findMany({
            where: {
              tenant_id: tenantId,
              OR: [
                { seccion: { contains: termino } },
                { estado: { contains: termino, mode: 'insensitive' } },
                { municipio: { contains: termino, mode: 'insensitive' } },
                ...(Number.isInteger(Number(termino)) && termino !== ''
                  ? [
                      { distrito_local: { equals: Number(termino) } },
                      { distrito_federal: { equals: Number(termino) } },
                    ]
                  : []),
              ],
            },
            take: max,
            orderBy: [{ estado_id: 'asc' }, { municipio_id: 'asc' }, { seccion: 'asc' }],
          })
          .then((rows) =>
            rows.map((s) => ({
              id: `ine-seccion-${s.seccion}-${s.estado_id}-${s.municipio_id}`,
              tipo: 'ine_seccion',
              nombre: `Sección ${s.seccion}`,
              descripcion: `${s.municipio}, ${s.estado}`,
              estado: s.estado,
              municipio: s.municipio,
              seccion: s.seccion,
              estado_id: s.estado_id,
              municipio_id: s.municipio_id,
              bbox: this.bboxFromGeometry(s.coordenadas),
              geometry: s.coordenadas,
            })),
          ),
      );
    }

    if (incluir('inegi')) {
      promesas.push(
        inegi
          .descargar('estados')
          .then((geo) => this.filtrarInegiGlobal(geo, 'estados', termino, max))
          .catch(() => []),
      );
      promesas.push(
        inegi
          .descargar('municipios')
          .then((geo) => this.filtrarInegiGlobal(geo, 'municipios', termino, max))
          .catch(() => []),
      );
    }

    if (incluir('colonia')) {
      promesas.push(
        nominatim
          .buscar(q)
          .then((rows) =>
            rows.slice(0, max).map((r) => ({
              id: `nominatim-${r.id}`,
              tipo: 'colonia',
              nombre: r.nombre,
              descripcion: r.direccion,
              bbox: this.bboxFromGeometry(r.geojson),
              geometry: r.geojson,
            })),
          )
          .catch(() => []),
      );
    }

    if (incluir('capa')) {
      promesas.push(
        this.prisma.capaMapa
          .findMany({
            where: {
              tenant_id: tenantId,
              tipo: { in: ['colonia', 'custom', 'inegi', 'secciones_ine'] },
              nombre: { contains: termino, mode: 'insensitive' },
            },
            take: max,
            orderBy: { nombre: 'asc' },
          })
          .then((rows) =>
            rows.map((c) => {
              const geo = (c.geojson as any)?.features?.[0]?.geometry;
              return {
                id: `capa-${c.id}`,
                tipo: c.tipo === 'colonia' ? 'capa_colonia' : 'capa_custom',
                nombre: c.nombre,
                descripcion: c.tipo,
                capaId: c.id,
                color: c.color,
                bbox: geo ? this.bboxFromGeometry(geo) : undefined,
                geometry: geo,
              };
            }),
          ),
      );
    }

    const resueltos = await Promise.allSettled(promesas);
    resueltos.forEach((r) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        resultados.push(...r.value);
      }
    });

    // Ordenar por relevancia simple: si el nombre comienza con el término, va primero
    resultados.sort((a, b) => {
      const aNombre = (a.nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const bNombre = (b.nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const aExacto = aNombre.startsWith(termino) ? 2 : aNombre.includes(termino) ? 1 : 0;
      const bExacto = bNombre.startsWith(termino) ? 2 : bNombre.includes(termino) ? 1 : 0;
      return bExacto - aExacto;
    });

    return { resultados: resultados.slice(0, max) };
  }

  private filtrarInegiGlobal(geo: any, tipo: TipoCapaInegi, termino: string, max: number): any[] {
    const features = geo?.features || [];
    return features
      .filter((f: any) => {
        const p = f.properties || {};
        const nombre = String(
          p.nomgeo || p.NOMGEO || p.NOMBRE || p.nombre || p.nom_loc || p.NOM_LOC || '',
        )
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '');
        return nombre.includes(termino);
      })
      .slice(0, max)
      .map((f: any) => {
        const p = f.properties || {};
        const clave = String(
          p.cvegeo || p.CVEGEO || p.cve_ent || p.CVE_ENT || p.cve_mun || p.CVE_MUN || '',
        );
        const nombre = p.nomgeo || p.NOMGEO || p.NOMBRE || p.nombre || p.nom_loc || p.NOM_LOC || clave;
        return {
          id: `inegi-${tipo}-${clave}`,
          tipo: tipo === 'estados' ? 'inegi_estado' : 'inegi_municipio',
          nombre,
          descripcion: tipo === 'estados' ? 'Estado' : 'Municipio',
          clave,
          bbox: this.bboxFromGeometry(f.geometry),
          geometry: f.geometry,
        };
      });
  }

  async detalleTerritorial(tenantId: string, dto: { tipo: string; id: string; nombre: string; geometry: any; estado_id?: number; municipio_id?: number; seccion?: string; clave?: string }) {
    const geometry = this.normalizarAMultiPolygon(dto.geometry);
    if (!geometry || !['Point', 'Polygon', 'MultiPolygon'].includes(geometry.type)) {
      throw new BadRequestException('La geometría seleccionada no es válida');
    }

    const bbox = this.bboxFromGeometry(geometry);
    const esPoligono = ['Polygon', 'MultiPolygon'].includes(geometry.type);
    const datosOficiales: any = {};
    let seccionFiltro: string | undefined = dto.seccion;

    if (dto.tipo === 'ine_seccion' && seccionFiltro) {
      const whereSeccion: any = { tenant_id: tenantId, seccion: seccionFiltro };
      if (dto.estado_id) whereSeccion.estado_id = dto.estado_id;
      if (dto.municipio_id) whereSeccion.municipio_id = dto.municipio_id;
      const seccionDB = await this.prisma.seccionINE.findFirst({
        where: whereSeccion,
        orderBy: { seccion: 'asc' },
      });
      if (seccionDB) {
        datosOficiales.padron_2024 = seccionDB.padron_2024;
        datosOficiales.lista_nominal_2024 = seccionDB.lista_nominal_2024;
        datosOficiales.distrito_federal = seccionDB.distrito_federal;
        datosOficiales.distrito_local = seccionDB.distrito_local;
      }
    }

    const ultimoResultado = seccionFiltro
      ? await this.prisma.resultadoHistorico.findFirst({
          where: { tenant_id: tenantId, seccion: seccionFiltro },
          orderBy: { anio: 'desc' },
        })
      : null;
    if (ultimoResultado) {
      datosOficiales.partido_ganador = ultimoResultado.partido_ganador;
      datosOficiales.votos_ganador = ultimoResultado.votos_ganador;
      datosOficiales.votos_totales = ultimoResultado.votos_totales;
      datosOficiales.participacion_pct = ultimoResultado.participacion_pct;
    }

    let votantes = { count: 0, items: [] };
    let lideres = { count: 0, items: [] };
    let apoyos = { count: 0, items: [] };
    let eventos = { count: 0, items: [] };
    let peticiones = { count: 0, items: [] };

    if (esPoligono) {
      [votantes, lideres, apoyos, eventos, peticiones] = await Promise.all([
        this.contarYListarVotantes(tenantId, geometry, seccionFiltro, 10),
        this.contarYListarLideres(tenantId, geometry, seccionFiltro, 10),
        this.contarYListarApoyos(tenantId, geometry, seccionFiltro, 10),
        this.contarEventos(tenantId, geometry, seccionFiltro, 10),
        this.contarPeticiones(tenantId, geometry, seccionFiltro, 10),
      ]);
    }

    return {
      tipo: dto.tipo,
      id: dto.id,
      nombre: dto.nombre,
      geometry,
      bbox,
      datos_oficiales: datosOficiales,
      resumen: {
        votantes,
        lideres,
        apoyos,
        eventos,
        peticiones,
      },
    };
  }

  private async contarYListarVotantes(tenantId: string, geometry: any, seccion?: string, limit = 10) {
    let rows: any[] = [];
    if (seccion) {
      rows = await this.prisma.votante.findMany({
        where: { tenant_id: tenantId, activo: true, seccion_electoral: seccion },
        orderBy: { created_at: 'desc' },
      });
    } else {
      rows = await this.candidatosEnBBox(tenantId, geometry, 'votantes');
    }

    const items = rows
      .filter((r) => {
        if (seccion) return true;
        const p = this.puntoDesde(r.coordenadas);
        return p ? this.puntoEnPoligono(p, geometry) : false;
      })
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        nombre: r.nombre,
        telefono: r.telefono,
        seccion_electoral: r.seccion_electoral,
        colonia: r.colonia,
        municipio: r.municipio,
        nivel_apoyo: r.nivel_apoyo,
        coordenadas: r.coordenadas,
      }));

    return { count: rows.length, items };
  }

  private async contarYListarLideres(tenantId: string, geometry: any, seccion?: string, limit = 10) {
    let rows: any[] = [];
    if (seccion) {
      rows = await this.prisma.lider.findMany({
        where: { tenant_id: tenantId, activo: true, votante: { seccion_electoral: seccion } },
        include: { votante: true },
        orderBy: { created_at: 'desc' },
      });
    } else {
      rows = await this.candidatosEnBBox(tenantId, geometry, 'lideres');
    }

    const items = rows
      .filter((r) => {
        if (seccion) return true;
        const p = this.puntoDesde(r.votante?.coordenadas || r.coordenadas);
        return p ? this.puntoEnPoligono(p, geometry) : false;
      })
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        nombre: r.votante?.nombre || r.nombre,
        telefono: r.votante?.telefono,
        seccion_electoral: r.votante?.seccion_electoral,
        colonia: r.votante?.colonia,
        score: r.score,
        coordenadas: r.votante?.coordenadas || r.coordenadas,
      }));

    return { count: rows.length, items };
  }

  private async contarYListarApoyos(tenantId: string, geometry: any, seccion?: string, limit = 10) {
    let rows: any[] = [];
    if (seccion) {
      rows = await this.prisma.apoyo.findMany({
        where: { tenant_id: tenantId, votante: { seccion_electoral: seccion } },
        include: { votante: true },
        orderBy: { fecha_entrega: 'desc' },
      });
    } else {
      rows = await this.candidatosEnBBox(tenantId, geometry, 'apoyos');
    }

    const items = rows
      .filter((r) => {
        if (seccion) return true;
        const p = this.puntoDesde(r.coordenadas || r.votante?.coordenadas);
        return p ? this.puntoEnPoligono(p, geometry) : false;
      })
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        tipo_apoyo: r.tipo_apoyo,
        cantidad: r.cantidad,
        fecha_entrega: r.fecha_entrega,
        votante_nombre: r.votante?.nombre,
        coordenadas: r.coordenadas || r.votante?.coordenadas,
      }));

    return { count: rows.length, items };
  }

  private async contarEventos(tenantId: string, geometry: any, seccion?: string, limit = 10) {
    let rows: any[] = [];
    if (seccion) {
      const zonas = await this.prisma.zona.findMany({
        where: { tenant_id: tenantId, secciones: { has: seccion } },
        select: { id: true },
      });
      const zonaIds = zonas.map((z) => z.id);
      rows = await this.prisma.evento.findMany({
        where: { tenant_id: tenantId, zona_id: { in: zonaIds } },
        orderBy: { fecha_inicio: 'desc' },
      });
    } else {
      rows = await this.candidatosEnBBox(tenantId, geometry, 'eventos');
      rows = rows.filter((r) => {
        const p = this.puntoDesde(r.coordenadas);
        return p ? this.puntoEnPoligono(p, geometry) : false;
      });
    }
    const items = rows.slice(0, limit).map((r) => ({
      id: r.id,
      nombre: r.nombre,
      direccion: r.direccion,
      fecha_inicio: r.fecha_inicio,
      status: r.status,
    }));
    return { count: rows.length, items };
  }

  private async contarPeticiones(tenantId: string, geometry: any, seccion?: string, limit = 10) {
    let rows: any[] = [];
    if (seccion) {
      rows = await this.prisma.peticion.findMany({
        where: { tenant_id: tenantId, votante: { seccion_electoral: seccion } },
        orderBy: { created_at: 'desc' },
        include: { votante: { select: { nombre: true } } },
      });
    } else {
      rows = await this.candidatosEnBBox(tenantId, geometry, 'peticiones');
      rows = rows.filter((r) => {
        const p = this.puntoDesde(r.coordenadas || r.votante?.coordenadas);
        return p ? this.puntoEnPoligono(p, geometry) : false;
      });
    }
    const items = rows.slice(0, limit).map((r) => ({
      id: r.id,
      titulo: r.titulo,
      categoria: r.categoria,
      prioridad: r.prioridad,
      estatus: r.estatus,
      votante_nombre: r.votante?.nombre || r.votante_nombre,
    }));
    return { count: rows.length, items };
  }

  private async candidatosEnBBox(tenantId: string, geometry: any, entidad: 'votantes' | 'lideres' | 'apoyos' | 'eventos' | 'peticiones') {
    const [minLng, minLat, maxLng, maxLat] = this.bboxFromGeometry(geometry);
    const tabla = {
      votantes: 'votantes',
      lideres: 'lideres',
      apoyos: 'apoyos',
      eventos: 'eventos',
      peticiones: 'peticiones',
    }[entidad];

    const includeVotante = entidad === 'lideres' || entidad === 'apoyos' || entidad === 'peticiones';
    const rawSelect = entidad === 'lideres'
      ? `l.*, v.nombre as votante_nombre, v.telefono as votante_telefono, v.seccion_electoral as votante_seccion, v.colonia as votante_colonia, v.coordenadas as votante_coordenadas, v.municipio as votante_municipio`
      : entidad === 'apoyos' || entidad === 'peticiones'
      ? `${tabla}.*, v.nombre as votante_nombre, v.coordenadas as votante_coordenadas`
      : `${tabla}.*`;

    const join = includeVotante
      ? `LEFT JOIN votantes v ON v.id = ${tabla}.votante_id AND v.tenant_id = ${tabla}.tenant_id`
      : '';

    const coordCampo = includeVotante
      ? `COALESCE(${tabla}.coordenadas, v.coordenadas)`
      : `${tabla}.coordenadas`;

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT ${rawSelect}
       FROM ${tabla}
       ${join}
       WHERE ${tabla}.tenant_id = $1::uuid
         AND ${coordCampo} IS NOT NULL
         AND (${coordCampo}->>'lat')::float BETWEEN $2 AND $3
         AND (${coordCampo}->>'lng')::float BETWEEN $4 AND $5`,
      tenantId,
      minLat,
      maxLat,
      minLng,
      maxLng,
    );

    return rows;
  }

  private puntoEnPoligono(coords: [number, number], geometry: any): boolean {
    try {
      return booleanPointInPolygon({ type: 'Point', coordinates: coords }, geometry);
    } catch {
      return false;
    }
  }

  private bboxFromGeometry(geometry: any): [number, number, number, number] {
    if (!geometry || !geometry.coordinates) return [-180, -90, 180, 90];

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    const visit = (coord: any) => {
      if (Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
        const [lng, lat] = coord;
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
      }
    };

    const walk = (node: any) => {
      if (Array.isArray(node)) {
        if (node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
          visit(node);
        } else {
          node.forEach(walk);
        }
      }
    };

    walk(geometry.coordinates);

    if (minLng === Infinity) return [-180, -90, 180, 90];
    return [minLng, minLat, maxLng, maxLat];
  }
}
