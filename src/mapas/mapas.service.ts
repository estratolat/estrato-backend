import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
      return this.formatearSecciones(secciones);
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
      return this.formatearSecciones(secciones);
    }

    const secciones = await this.prisma.seccionINE.findMany({
      where: { ...baseWhere, seccion: { in: Array.from(set) } },
    });

    return this.formatearSecciones(secciones);
  }

  private formatearSecciones(secciones: any[]) {
    const features = secciones
      .filter(s => s.coordenadas)
      .map(s => ({
        type: 'Feature',
        geometry: s.coordenadas,
        properties: {
          id: s.seccion,
          seccion: s.seccion,
          nombre: `Sección ${s.seccion}`,
          estado: s.estado,
          municipio: s.municipio,
          padron_2024: s.padron_2024,
          lista_nominal_2024: s.lista_nominal_2024,
        },
      }));

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
