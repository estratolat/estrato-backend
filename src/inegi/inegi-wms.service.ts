import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';

export type CapaInegiWms =
  | 'estados'
  | 'municipios'
  | 'localidades'
  | 'ageb'
  | 'manzanas'
  | 'vialidades'
  | 'geoelectorales';

interface TileParams {
  capa: CapaInegiWms;
  bbox: string;
  width: string;
  height: string;
  srs?: string;
  version?: string;
  format?: string;
  styles?: string;
  cve?: string;
  transparent?: string;
  indicador?: string;
}

@Injectable()
export class InegiWmsService {
  private readonly logger = new Logger(InegiWmsService.name);
  private readonly endpoint = 'https://gaia.inegi.org.mx/NLB/mdm5.wms';
  private readonly endpointTematico = 'https://gaia.inegi.org.mx/NLB/tunnel/wms/mdm6wms';

  // Nombres de capa en el WMS del INEGI según documentación y OSM layer index
  private readonly layerNames: Record<CapaInegiWms, { layer: string; style: string; cqlField: string; tematico?: boolean; indicador?: string }> = {
    estados: { layer: 'Límite_geoestadístico_estatal', style: '', cqlField: 'CVE_ENT' },
    municipios: { layer: 'Límite_geoestadístico_municipal', style: '', cqlField: 'CVE_MUN' },
    localidades: { layer: 'Localidad_urbana_y_rural_amanzanada', style: '', cqlField: 'CVE_LOC' },
    ageb: { layer: 'AGEB_urbanas', style: '', cqlField: 'CVE_AGEB' },
    manzanas: { layer: 'Manzanas', style: '', cqlField: 'CVE_MZA' },
    vialidades: { layer: 'Vialidades', style: '', cqlField: '' },
    geoelectorales: { layer: 'cgeoelectorales', style: '', cqlField: '', tematico: true, indicador: 'POBTOT' },
  };

  constructor(private http: HttpService) {}

  async proxyTile(params: TileParams, res: Response) {
    const config = this.layerNames[params.capa];
    if (!config) {
      throw new BadRequestException('Capa INEGI no soportada');
    }

    const esTematico = config.tematico;
    const query = new URLSearchParams();
    query.set('Request', 'GetMap');
    query.set('Service', 'WMS');
    query.set('Version', params.version || '1.1.1');
    query.set('Layers', config.layer);
    query.set('Styles', params.styles || config.style);
    query.set('Format', params.format || 'image/png');
    query.set('Transparent', params.transparent || 'true');
    query.set('SRS', params.srs || 'EPSG:3857');
    query.set('BBOX', params.bbox);
    query.set('WIDTH', params.width || '256');
    query.set('HEIGHT', params.height || '256');
    query.set('TILED', 'true');

    if (esTematico) {
      // El WMS temático del MDM6 requiere mapa tematización y parámetros de indicador
      query.set('map', '/opt/map/mdm60/tematizacion.map');
      const indicador = params.indicador || config.indicador || 'POBTOT';
      query.set('indicador', indicador);
    }

    const cql = this.buildCql(config.cqlField, params.cve, params.capa);
    if (cql) {
      query.set('CQL_FILTER', cql);
    }

    const baseUrl = esTematico ? this.endpointTematico : this.endpoint;
    const url = `${baseUrl}?${query.toString()}`;
    this.logger.debug(`Proxy INEGI WMS: ${url}`);

    try {
      const response = await lastValueFrom(
        this.http.get(url, {
          responseType: 'arraybuffer',
          timeout: 20000,
          headers: { Accept: 'image/png,image/*' },
        }),
      );

      const rawContentType = response.headers['content-type'];
      const contentType =
        typeof rawContentType === 'string'
          ? rawContentType
          : Array.isArray(rawContentType)
            ? rawContentType[0]
            : 'image/png';

      const data = Buffer.isBuffer(response.data)
        ? response.data
        : Buffer.from(response.data);

      // Si INEGI devolvió un error en texto/XML, enviar tile PNG transparente para no romper el mapa
      if (!contentType.startsWith('image/') || data.length < 100) {
        this.logger.warn(`Respuesta INEGI no es imagen válida: ${contentType}, ${data.length} bytes. URL: ${url}`);
        const transparentPng = this.transparentPng();
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache');
        res.status(200).send(transparentPng);
        return;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.status(200).send(data);
    } catch (err: any) {
      this.logger.error(`Error proxy INEGI WMS: ${err?.message}`, err?.response?.status, url);
      const transparentPng = this.transparentPng();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-cache');
      res.status(200).send(transparentPng);
    }
  }

  private transparentPng(): Buffer {
    // PNG transparente 1x1 píxel en base64
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
  }

  private buildCql(field: string, cve?: string, capa?: CapaInegiWms): string {
    if (!field || !cve) return '';

    const clean = String(cve).replace(/\D/g, '');
    if (!clean) return '';

    // Si la clave ya incluye CVEGEO completo, filtrar por CVEGEO
    if (capa === 'estados' && clean.length === 2) {
      return `${field}='${clean}'`;
    }

    if (capa === 'municipios') {
      if (clean.length === 5) return `CVEGEO='${clean}'`;
      if (clean.length === 2) return `${field}='${clean.padStart(3, '0')}' OR CVE_ENT='${clean}'`;
      return `${field}='${clean.padStart(3, '0')}'`;
    }

    if (capa === 'localidades') {
      if (clean.length >= 9) return `CVEGEO='${clean.slice(0, 9)}'`;
      if (clean.length === 5) {
        const ent = clean.slice(0, 2);
        const mun = clean.slice(2, 5);
        return `CVE_ENT='${ent}' AND CVE_MUN='${mun}'`;
      }
      return `${field}='${clean.padStart(4, '0')}'`;
    }

    if (capa === 'ageb') {
      if (clean.length >= 5) {
        const ent = clean.slice(0, 2);
        const mun = clean.slice(2, 5);
        return `CVE_ENT='${ent}' AND CVE_MUN='${mun}'`;
      }
      return '';
    }

    if (capa === 'manzanas') {
      if (clean.length >= 9) {
        const ent = clean.slice(0, 2);
        const mun = clean.slice(2, 5);
        const loc = clean.slice(5, 9);
        return `CVE_ENT='${ent}' AND CVE_MUN='${mun}' AND CVE_LOC='${loc}'`;
      }
      return '';
    }

    if (capa === 'geoelectorales') {
      // La capa geoelectorales cubre todo el país; el cve puede filtrar por CVE_ENT si se proporciona
      if (clean.length >= 2) {
        const ent = clean.slice(0, 2);
        return `CVE_ENT='${ent}'`;
      }
      return '';
    }

    return `${field}='${clean}'`;
  }
}
