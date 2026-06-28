import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { centroide, distanciaKm, Point } from './geo-utils';

export interface AgebFeature {
  type: 'Feature';
  geometry: any;
  properties: Record<string, any>;
}

@Injectable()
export class AgebInegiService {
  private readonly logger = new Logger(AgebInegiService.name);
  private readonly baseUrl = 'https://gaia.inegi.org.mx/wscatgeo/v2';
  private cache: Record<string, { features: AgebFeature[]; expira: number }> = {};
  private readonly ttlMs = 1000 * 60 * 60 * 6; // 6 horas

  constructor(private http: HttpService) {}

  async buscarClaveMunicipio(cveEnt: string, nombreMunicipio: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/geo/municipios/${cveEnt}`;
      this.logger.debug(`Descargando municipios: ${url}`);
      const response = await lastValueFrom(
        this.http.get(url, { timeout: 60000 }),
      );
      const features = response.data?.features || [];
      const normalizado = this.normalizar(nombreMunicipio);

      for (const f of features) {
        const p = f.properties || {};
        const nombre = this.normalizar(p.nomgeo || p.NOMGEO || p.nombre || p.NOMBRE || '');
        if (nombre === normalizado || nombre.includes(normalizado) || normalizado.includes(nombre)) {
          return String(p.cve_mun || p.CVE_MUN || '').padStart(3, '0');
        }
      }
      return null;
    } catch (err: any) {
      this.logger.warn(`No se pudieron cargar municipios de INEGI: ${err.message}`);
      return null;
    }
  }

  async buscarAgebs(cveEnt: string, cveMun: string): Promise<AgebFeature[]> {
    const clave = `${cveEnt}_${cveMun}`;
    const cached = this.cache[clave];
    if (cached && cached.expira > Date.now()) {
      return cached.features;
    }

    try {
      const url = `${this.baseUrl}/geo/agebu/${cveEnt}/${cveMun}`;
      this.logger.debug(`Descargando AGEBs: ${url}`);
      const response = await lastValueFrom(
        this.http.get(url, { timeout: 120000 }),
      );
      const features = (response.data?.features || []) as AgebFeature[];
      this.cache[clave] = { features, expira: Date.now() + this.ttlMs };
      this.logger.log(`AGEBs cargadas para ${clave}: ${features.length}`);
      return features;
    } catch (err: any) {
      this.logger.warn(`Error descargando AGEBs ${clave}: ${err.message}`);
      return [];
    }
  }

  async agebsCercanas(
    cveEnt: string,
    cveMun: string,
    punto: Point,
    radioKm = 0.6,
    maxResultados = 3,
  ): Promise<AgebFeature[]> {
    const agebs = await this.buscarAgebs(cveEnt, cveMun);
    const conDistancia = agebs
      .map((f) => {
        const c = centroide(f.geometry);
        return {
          feature: f,
          distancia: c ? distanciaKm(punto, c) : Infinity,
        };
      })
      .filter((x) => x.distancia <= radioKm)
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, maxResultados);

    return conDistancia.map((x) => x.feature);
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
}
