import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { SepomexCatalogoService, AsentamientoSepomex } from './sepomex-catalogo.service';
import { ColoniasNominatimService } from './nominatim.service';
import { AgebInegiService, AgebFeature } from './ageb-inegi.service';
import { centroide, distanciaKm, Point, unirGeometrias } from './geo-utils';

export interface ResultadoColonia {
  id: string;
  nombre: string;
  tipo: string;
  codigo_postal?: string;
  municipio?: string;
  estado: string;
  estado_id: string;
  direccion?: string;
  geojson: any;
  fuente?: 'nominatim' | 'sepomex' | 'inegi-ageb';
  aproximado?: boolean;
}

interface CacheEstado {
  descargado: boolean;
  features: any[];
  municipios: Set<string>;
}

@Injectable()
export class ColoniasService {
  private readonly logger = new Logger(ColoniasService.name);
  private readonly baseUrl = 'https://raw.githubusercontent.com/open-mexico/mexico-geojson/main';
  private cache: Record<string, CacheEstado> = {};

  // Mapeo de nombres de estados a claves INEGI (01-32)
  private readonly ESTADO_CLAVE: Record<string, string> = {
    aguascalientes: '01',
    'baja california': '02',
    'baja california sur': '03',
    campeche: '04',
    coahuila: '05',
    'coahuila de zaragoza': '05',
    colima: '06',
    chiapas: '07',
    chihuahua: '08',
    'ciudad de mexico': '09',
    cdmx: '09',
    durango: '10',
    guanajuato: '11',
    guerrero: '12',
    hidalgo: '13',
    jalisco: '14',
    mexico: '15',
    'estado de mexico': '15',
    michoacan: '16',
    'michoacan de ocampo': '16',
    morelos: '17',
    nayarit: '18',
    'nuevo leon': '19',
    oaxaca: '20',
    puebla: '21',
    queretaro: '22',
    'queretaro de arteaga': '22',
    'quintana roo': '23',
    'san luis potosi': '24',
    sinaloa: '25',
    sonora: '26',
    tabasco: '27',
    tamaulipas: '28',
    tlaxcala: '29',
    veracruz: '30',
    'veracruz de ignacio de la llave': '30',
    yucatan: '31',
    zacatecas: '32',
  };

  constructor(
    private http: HttpService,
    private sepomex: SepomexCatalogoService,
    private nominatim: ColoniasNominatimService,
    private agebInegi: AgebInegiService,
  ) {}

  async buscar(
    query: string,
    estado?: string,
    municipio?: string,
  ): Promise<ResultadoColonia[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('La búsqueda debe tener al menos 2 caracteres');
    }

    const termino = query.trim();
    const esCp = /^\d{4,5}$/.test(termino);
    const resultados: ResultadoColonia[] = [];
    const vistos = new Set<string>();

    // 1) Nominatim: intentar obtener el trazo real de la colonia desde OpenStreetMap.
    if (!esCp) {
      const nominatim = await this.nominatim.buscar(termino, estado, municipio);
      for (const r of nominatim) {
        if (vistos.has(r.id)) continue;
        vistos.add(r.id);
        resultados.push(r);
        if (resultados.length >= 50) return resultados.slice(0, 50);
      }
    }

    // 2) INEGI AGEB: intentar construir un polígono más fino usando AGEB urbanas.
    if (!esCp) {
      const asentamientos = await this.sepomex.buscar(termino, estado, municipio);
      const agebResultados = await this.buscarAgebPorAsentamientos(asentamientos, termino, vistos);
      for (const r of agebResultados) {
        if (vistos.has(r.id)) continue;
        vistos.add(r.id);
        resultados.push(r);
        if (resultados.length >= 50) return resultados.slice(0, 50);
      }
    }

    // 3) SEPOMEX: cobertura postal aproximada (último fallback).
    if (esCp) {
      const asentamientos = await this.sepomex.buscarPorCp(termino);
      if (!asentamientos.length) {
        return this.buscarPorCpEnGeojson(termino, estado, municipio);
      }

      for (const a of asentamientos) {
        const estadoId = this.resolverEstadoId(a.estado);
        if (!estadoId) continue;

        if (estado && !this.coincideEstado(a.estado, estado)) continue;
        if (municipio && !this.coincideTexto(a.municipio, municipio)) continue;

        const feature = await this.featurePorCp(estadoId, termino);
        if (!feature) continue;

        const clave = `${estadoId}_${termino}`;
        if (vistos.has(clave)) continue;
        vistos.add(clave);

        resultados.push({
          ...this.featureAResultado(feature, estadoId, a),
          aproximado: true,
          fuente: 'sepomex',
        });
      }
    } else {
      const asentamientos = await this.sepomex.buscar(termino, estado, municipio);
      const porEstado: Record<string, AsentamientoSepomex[]> = {};

      for (const a of asentamientos) {
        const estadoId = this.resolverEstadoId(a.estado);
        if (!estadoId) continue;

        if (estado && !this.coincideEstado(a.estado, estado)) continue;
        if (municipio && !this.coincideTexto(a.municipio, municipio)) continue;

        if (!porEstado[estadoId]) porEstado[estadoId] = [];
        porEstado[estadoId].push(a);
      }

      for (const estadoId of Object.keys(porEstado)) {
        try {
          const geo = await this.descargarEstado(estadoId);
          if (!geo?.features?.length) continue;

          for (const a of porEstado[estadoId]) {
            const cp = a.codigo.padStart(5, '0');
            const feature = geo.features.find(
              (f: any) =>
                String(f.properties?.d_codigo || f.properties?.cp || '').padStart(5, '0') === cp,
            );
            if (!feature) continue;

            const clave = `${estadoId}_${cp}_${this.normalizar(a.nombre)}`;
            if (vistos.has(clave)) continue;
            vistos.add(clave);

            resultados.push({
              ...this.featureAResultado(feature, estadoId, a),
              aproximado: true,
              fuente: 'sepomex',
            });
            if (resultados.length >= 50) return resultados.slice(0, 50);
          }
        } catch (err: any) {
          this.logger.warn(`No se pudo cargar colonias para estado ${estadoId}: ${err.message}`);
        }
      }
    }

    return resultados.slice(0, 50);
  }

  private async buscarAgebPorAsentamientos(
    asentamientos: AsentamientoSepomex[],
    termino: string,
    vistos: Set<string>,
  ): Promise<ResultadoColonia[]> {
    const resultados: ResultadoColonia[] = [];

    for (const a of asentamientos.slice(0, 15)) {
      const estadoId = this.resolverEstadoId(a.estado);
      if (!estadoId) continue;

      // Obtenemos un punto de referencia: centro del polígono postal del CP.
      const featurePostal = await this.featurePorCp(estadoId, a.codigo);
      if (!featurePostal) continue;

      const punto = centroide(featurePostal.geometry);
      if (!punto) continue;

      const cveMun = await this.agebInegi.buscarClaveMunicipio(estadoId, a.municipio);
      if (!cveMun) continue;

      const agebs = await this.agebInegi.agebsCercanas(estadoId, cveMun, punto, 0.8, 3);
      if (!agebs.length) continue;

      const id = `inegi_ageb_${estadoId}_${cveMun}_${this.normalizar(a.nombre)}_${a.codigo}`;
      if (vistos.has(id)) continue;
      vistos.add(id);

      const geometry = unirGeometrias(agebs.map((x) => x.geometry));
      if (!geometry) continue;

      resultados.push({
        id,
        nombre: `${a.nombre} (aprox. AGEB INEGI)`,
        tipo: a.tipo || 'Colonia',
        codigo_postal: a.codigo,
        municipio: a.municipio,
        estado: a.estado,
        estado_id: estadoId,
        direccion: `${a.nombre}, ${a.municipio}, ${a.estado}, CP ${a.codigo}`,
        geojson: geometry,
        fuente: 'inegi-ageb',
        aproximado: true,
      });
    }

    return resultados;
  }

  async obtenerPorId(estadoId: string, featureId: string): Promise<ResultadoColonia | null> {
    const geo = await this.descargarEstado(estadoId);

    // Extraemos CP y nombre del ID: sepomex_{estado}_{cp}_{nombre-normalizado}
    const partes = featureId.split('_');
    const cpId = (partes[2] || '').padStart(5, '0');
    const nombreId = partes.slice(3).join('_') || '';

    // Buscamos primero por CP para no depender del nombre del polígono (que suele estar vacío).
    let feature = geo?.features?.find((f: any) => {
      const cpFeature = String(f.properties?.d_codigo || f.properties?.cp || '').padStart(5, '0');
      return cpFeature === cpId;
    });

    // Si hay varios asentamientos con el mismo CP, restringimos por nombre cuando sea posible.
    if (feature && nombreId) {
      const nombreNormalizado = this.normalizar(nombreId);
      const matchExacto = geo.features.find((f: any) => {
        const cpFeature = String(f.properties?.d_codigo || f.properties?.cp || '').padStart(5, '0');
        if (cpFeature !== cpId) return false;
        const nombreFeature = this.normalizar(
          f.properties?.d_asenta || f.properties?.nombre || f.properties?.name || '',
        );
        return nombreFeature === nombreNormalizado;
      });
      if (matchExacto) feature = matchExacto;
    }

    if (!feature) return null;

    const cp = String(feature.properties?.d_codigo || '');
    let asentamiento: AsentamientoSepomex | undefined;

    if (cp) {
      const candidatos = await this.sepomex.buscarPorCp(cp);
      const nombreNormalizado = this.normalizar(nombreId);
      asentamiento =
        candidatos.find(
          (a) =>
            this.resolverEstadoId(a.estado) === estadoId &&
            this.normalizar(a.nombre) === nombreNormalizado,
        ) ||
        candidatos.find((a) => this.resolverEstadoId(a.estado) === estadoId) ||
        candidatos[0];
    }

    return this.featureAResultado(feature, estadoId, asentamiento);
  }

  private async descargarEstado(clave: string): Promise<any> {
    if (this.cache[clave]?.descargado) {
      return { features: this.cache[clave].features };
    }

    const url = `${this.baseUrl}/${clave}-Gto.geojson`;
    // Los archivos usan abreviaturas; intentamos la clave directa y luego nombres comunes
    const urls = this.buildUrls(clave);

    for (const u of urls) {
      try {
        this.logger.debug(`Descargando colonias: ${u}`);
        const response = await lastValueFrom(
          this.http.get(u, {
            headers: { Accept: 'application/json' },
            timeout: 60000,
          }),
        );
        const data = response.data || {};
        const features = data.features || [];
        this.cache[clave] = {
          descargado: true,
          features,
          municipios: new Set(
            features.map((f: any) => this.normalizar(f.properties?.d_mnpio || f.properties?.municipio || '')).filter(Boolean),
          ),
        };
        this.logger.log(`Colonias cargadas para ${clave}: ${features.length} polígonos`);
        return data;
      } catch (err: any) {
        this.logger.warn(`Falló descarga de colonias ${u}: ${err?.message}`);
      }
    }

    throw new BadRequestException(`No se pudieron cargar colonias para el estado ${clave}`);
  }

  private buildUrls(clave: string): string[] {
    // Mapeo de clave INEGI a nombre de archivo del repo open-mexico/mexico-geojson
    const nombres: Record<string, string> = {
      '01': '01-Ags',
      '02': '02-Bc',
      '03': '03-Bcs',
      '04': '04-Camp',
      '05': '05-Coah',
      '06': '06-Col',
      '07': '07-Chis',
      '08': '08-Chih',
      '09': '09-Cdmx',
      '10': '10-Dgo',
      '11': '11-Gto',
      '12': '12-Gro',
      '13': '13-Hgo',
      '14': '14-Jal',
      '15': '15-Mex',
      '16': '16-Mich',
      '17': '17-Mor',
      '18': '18-Nay',
      '19': '19-NL',
      '20': '20-Oax',
      '21': '21-Pue',
      '22': '22-Qro',
      '23': '23-Qroo',
      '24': '24-SLP',
      '25': '25-Sin',
      '26': '26-Son',
      '27': '27-Tab',
      '28': '28-Tmps',
      '29': '29-Tlax',
      '30': '30-Ver',
      '31': '31-Yuc',
      '32': '32-Zac',
    };
    const nombre = nombres[clave];
    if (!nombre) return [];
    return [`${this.baseUrl}/${nombre}.geojson`];
  }

  private resolverEstadoId(nombre: string): string | null {
    const n = this.normalizar(nombre);
    return this.ESTADO_CLAVE[n] || null;
  }

  private featureAResultado(
    feature: any,
    estadoId: string,
    asentamiento?: AsentamientoSepomex,
  ): ResultadoColonia {
    const p = feature.properties || {};
    const cp = (asentamiento?.codigo || String(p.d_codigo || p.cp || p.codigo || '')).padStart(5, '0');
    const nombre = asentamiento?.nombre || p.d_asenta || p.nombre || p.name || 'Sin nombre';
    const municipio = asentamiento?.municipio || p.d_mnpio || p.municipio || p.mun || '';
    const tipo = asentamiento?.tipo || p.d_tipo_asenta || p.tipo || 'Colonia';
    const id = this.crearId(p, estadoId, asentamiento?.nombre);
    const nombreEstado = this.nombreEstado(estadoId);

    return {
      id,
      nombre,
      tipo,
      codigo_postal: cp,
      municipio,
      estado: nombreEstado,
      estado_id: estadoId,
      direccion: `${nombre}, ${municipio}, ${nombreEstado}, CP ${cp}`,
      geojson: feature.geometry,
      fuente: 'sepomex',
      aproximado: false,
    };
  }

  private crearId(p: any, estadoId: string, nombreFallback?: string): string {
    const cp = String(p.d_codigo || p.cp || p.codigo || '00000').padStart(5, '0');
    const nombre = this.normalizar(
      nombreFallback || p.d_asenta || p.nombre || p.name || 'sin-nombre',
    );
    return `sepomex_${estadoId}_${cp}_${nombre}`;
  }

  async obtenerPorIdNominatim(featureId: string): Promise<ResultadoColonia | null> {
    const partes = featureId.split('_');
    if (partes.length < 3) return null;

    try {
      const response = await lastValueFrom(
        this.http.get('https://nominatim.openstreetmap.org/lookup', {
          params: {
            osm_ids: partes.slice(1).join('_').replace(/_/g, ''),
            format: 'geojson',
            polygon_geojson: 1,
            addressdetails: 1,
          },
          headers: {
            Accept: 'application/json',
            'User-Agent': 'ESTRATO SaaS / contacto@estrato.mx',
          },
          timeout: 30000,
        }),
      );

      const features = response.data?.features || [];
      if (!features.length) return null;

      const f = features[0];
      const props = f.properties || {};
      const address = props.address || {};

      return {
        id: featureId,
        nombre: props.namedetails?.name || props.display_name?.split(',')[0] || '',
        tipo: props.type || props.category || 'colonia',
        codigo_postal: address.postcode || '',
        municipio: address.county || address.city || address.town || address.municipality || '',
        estado: address.state || '',
        estado_id: this.resolverEstadoId(address.state || '') || '',
        direccion: props.display_name || '',
        geojson: f.geometry,
        fuente: 'nominatim',
        aproximado: false,
      };
    } catch (err: any) {
      this.logger.warn(`Nominatim lookup falló: ${err.message}`);
      return null;
    }
  }

  async obtenerPorIdAgeb(featureId: string): Promise<ResultadoColonia | null> {
    // Formato: inegi_ageb_{estadoId}_{cveMun}_{nombre}_{cp}
    const partes = featureId.split('_');
    if (partes.length < 6 || partes[0] !== 'inegi' || partes[1] !== 'ageb') return null;

    const estadoId = partes[2];
    const cveMun = partes[3];
    const cp = partes[partes.length - 1].padStart(5, '0');
    const nombre = partes.slice(4, partes.length - 1).join(' ');
    const estadoNombre = this.nombreEstado(estadoId);

    const featurePostal = await this.featurePorCp(estadoId, cp);
    if (!featurePostal) return null;

    const punto = centroide(featurePostal.geometry);
    if (!punto) return null;

    const agebs = await this.agebInegi.agebsCercanas(estadoId, cveMun, punto, 0.8, 3);
    if (!agebs.length) return null;

    const geometry = unirGeometrias(agebs.map((x) => x.geometry));
    if (!geometry) return null;

    return {
      id: featureId,
      nombre: `${nombre} (aprox. AGEB INEGI)`,
      tipo: 'Colonia',
      codigo_postal: cp,
      municipio: '',
      estado: estadoNombre,
      estado_id: estadoId,
      direccion: `${nombre}, ${estadoNombre}, CP ${cp}`,
      geojson: geometry,
      fuente: 'inegi-ageb',
      aproximado: true,
    };
  }

  private async featurePorCp(estadoId: string, cp: string): Promise<any | null> {
    try {
      const geo = await this.descargarEstado(estadoId);
      if (!geo?.features?.length) return null;
      return (
        geo.features.find(
          (f: any) => String(f.properties?.d_codigo || f.properties?.cp || '').padStart(5, '0') === cp.padStart(5, '0'),
        ) || null
      );
    } catch (err: any) {
      this.logger.warn(`No se pudo cargar estado ${estadoId} para CP ${cp}: ${err.message}`);
      return null;
    }
  }

  private async buscarPorCpEnGeojson(
    cp: string,
    estado?: string,
    municipio?: string,
  ): Promise<ResultadoColonia[]> {
    const resultados: ResultadoColonia[] = [];
    const vistos = new Set<string>();
    const claves = estado
      ? [this.resolverEstadoId(estado)].filter(Boolean)
      : [...new Set(Object.values(this.ESTADO_CLAVE))];

    for (const estadoId of claves) {
      const feature = await this.featurePorCp(estadoId, cp);
      if (!feature) continue;

      const clave = `${estadoId}_${cp}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);

      if (municipio) {
        const nombreMun = this.normalizar(feature.properties?.d_mnpio || '');
        if (!this.coincideTexto(nombreMun, municipio)) continue;
      }

      resultados.push(this.featureAResultado(feature, estadoId));
    }

    return resultados.slice(0, 50);
  }

  private coincideEstado(nombreEstado: string, filtro: string): boolean {
    const estadoFiltro = this.resolverEstadoId(filtro);
    if (estadoFiltro) {
      return this.resolverEstadoId(nombreEstado) === estadoFiltro;
    }
    return this.coincideTexto(nombreEstado, filtro);
  }

  private coincideTexto(texto: string, filtro: string): boolean {
    const a = this.normalizar(texto);
    const b = this.normalizar(filtro);
    return a.includes(b) || b.includes(a);
  }

  private normalizar(texto: string): string {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private nombreEstado(clave: string): string {
    const nombres: Record<string, string> = {
      '01': 'Aguascalientes',
      '02': 'Baja California',
      '03': 'Baja California Sur',
      '04': 'Campeche',
      '05': 'Coahuila',
      '06': 'Colima',
      '07': 'Chiapas',
      '08': 'Chihuahua',
      '09': 'Ciudad de México',
      '10': 'Durango',
      '11': 'Guanajuato',
      '12': 'Guerrero',
      '13': 'Hidalgo',
      '14': 'Jalisco',
      '15': 'México',
      '16': 'Michoacán',
      '17': 'Morelos',
      '18': 'Nayarit',
      '19': 'Nuevo León',
      '20': 'Oaxaca',
      '21': 'Puebla',
      '22': 'Querétaro',
      '23': 'Quintana Roo',
      '24': 'San Luis Potosí',
      '25': 'Sinaloa',
      '26': 'Sonora',
      '27': 'Tabasco',
      '28': 'Tamaulipas',
      '29': 'Tlaxcala',
      '30': 'Veracruz',
      '31': 'Yucatán',
      '32': 'Zacatecas',
    };
    return nombres[clave] || clave;
  }
}
