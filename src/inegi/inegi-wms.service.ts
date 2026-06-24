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
  | 'vialidades';

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
}

@Injectable()
export class InegiWmsService {
  private readonly logger = new Logger(InegiWmsService.name);
  private readonly endpoint = 'https://gaia.inegi.org.mx/NLB/mdm5.wms';

  // Nombres de capa en el WMS del INEGI según documentación y OSM layer index
  private readonly layerNames: Record<CapaInegiWms, { layer: string; style: string; cqlField: string }> = {
    estados: { layer: 'Límite_geoestadístico_estatal', style: '', cqlField: 'CVE_ENT' },
    municipios: { layer: 'Límite_geoestadístico_municipal', style: '', cqlField: 'CVE_MUN' },
    localidades: { layer: 'Localidad_urbana_y_rural_amanzanada', style: '', cqlField: 'CVE_LOC' },
    ageb: { layer: 'AGEB_urbanas', style: '', cqlField: 'CVE_AGEB' },
    manzanas: { layer: 'Manzanas', style: '', cqlField: 'CVE_MZA' },
    vialidades: { layer: 'Vialidades', style: '', cqlField: '' },
  };

  constructor(private http: HttpService) {}

  async proxyTile(params: TileParams, res: Response) {
    const config = this.layerNames[params.capa];
    if (!config) {
      throw new BadRequestException('Capa INEGI no soportada');
    }

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

    const cql = this.buildCql(config.cqlField, params.cve, params.capa);
    if (cql) {
      query.set('CQL_FILTER', cql);
    }

    const url = `${this.endpoint}?${query.toString()}`;
    this.logger.debug(`Proxy INEGI WMS: ${url}`);

    try {
      const response = await lastValueFrom(
        this.http.get(url, {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: { Accept: 'image/png,image/*' },
        }),
      );

      const contentType =
        typeof response.headers['content-type'] === 'string'
          ? response.headers['content-type']
          : 'image/png';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.status(200).send(response.data);
    } catch (err: any) {
      this.logger.error(`Error proxy INEGI WMS: ${err?.message}`, err?.response?.status, url);
      throw new BadRequestException('No se pudo obtener la capa del INEGI');
    }
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

    return `${field}='${clean}'`;
  }
}
