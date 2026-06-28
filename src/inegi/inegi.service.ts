import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export type TipoCapaInegi =
  | 'estados'
  | 'municipios'
  | 'localidades'
  | 'ageb'
  | 'manzanas'
  | 'vialidades';

export interface ResultadoBusquedaInegi {
  clave: string;
  nombre: string;
  tipo: TipoCapaInegi;
  entidad?: string;
  municipio?: string;
  localidad?: string;
  feature?: any;
}

interface ClavePartes {
  ent: string;
  mun: string;
  loc: string;
}

@Injectable()
export class InegiService {
  private readonly logger = new Logger(InegiService.name);
  private readonly baseUrl = 'https://gaia.inegi.org.mx/wscatgeo/v2/geo';

  constructor(private http: HttpService) {}

  async descargar(tipo: TipoCapaInegi, clave?: string): Promise<any> {
    const urls = this.buildUrls(tipo, clave);
    const results = await Promise.all(
      urls.map((url) => this.fetchJson(url)),
    );

    // Combinar múltiples FeatureCollection si se pidieron (por ejemplo U + R)
    const features = results.flatMap((r) => r?.features || []);
    const metadatos = results.map((r) => r?.metadatos).filter(Boolean);

    if (features.length === 0) {
      throw new BadRequestException(`La capa ${tipo} no devolvió polígonos para la clave ${clave || '(vacía)'}. Verifica la clave en el INEGI.`);
    }

    return {
      type: 'FeatureCollection',
      features,
      metadatos,
    };
  }

  private async fetchJson(url: string): Promise<any> {
    this.logger.debug(`Consultando INEGI: ${url}`);
    try {
      const response = await lastValueFrom(
        this.http.get(url, {
          headers: { Accept: 'application/json' },
          timeout: 60000,
        }),
      );
      return response.data;
    } catch (err: any) {
      this.logger.error(`Error consultando INEGI ${url}: ${err?.message}`, err?.response?.status);
      throw new BadRequestException(`Error del servicio del INEGI: ${err?.message || 'Sin respuesta'}`);
    }
  }

  private buildUrls(tipo: TipoCapaInegi, clave?: string): string[] {
    const c = this.limpiarClave(clave);
    switch (tipo) {
      case 'estados':
        return [`${this.baseUrl}/mgee/${c}`];

      case 'municipios': {
        if (c.length >= 5) {
          const p = this.partes(c); // ent(2) + mun(3)
          return [`${this.baseUrl}/mgem/${p.ent}/${p.mun}`];
        }
        if (c.length === 2) {
          return [`${this.baseUrl}/mgem/${c.padStart(2, '0')}`];
        }
        return [`${this.baseUrl}/mgem/`];
      }

      case 'localidades': {
        const p = this.partes(c);
        if (!p.ent || !p.mun) {
          throw new BadRequestException('Se requiere clave de municipio (5 dígitos) o localidad (9 dígitos) para localidades');
        }
        // Consultar urbanas (U) y rurales (R) para cubrir todo el municipio
        return [
          `${this.baseUrl}/localidades/pol/${p.ent}/${p.mun}/U`,
          `${this.baseUrl}/localidades/pol/${p.ent}/${p.mun}/R`,
        ];
      }

      case 'ageb': {
        const p = this.partes(c);
        if (!p.ent || !p.mun) {
          throw new BadRequestException('Se requiere clave de municipio (5 dígitos) para AGEB');
        }
        return [`${this.baseUrl}/agebu/${p.ent}/${p.mun}`];
      }

      case 'manzanas': {
        const p = this.partes(c);
        if (!p.ent || !p.mun || !p.loc) {
          throw new BadRequestException('Se requiere clave de localidad (9 dígitos) para manzanas');
        }
        return [`${this.baseUrl}/mza/${p.ent}/${p.mun}/${p.loc}/U`];
      }

      case 'vialidades': {
        const p = this.partes(c);
        if (!p.ent || !p.mun) {
          throw new BadRequestException('Se requiere clave de municipio (5 dígitos) para vialidades');
        }
        return [`${this.baseUrl}/vialidades/${p.ent}/${p.mun}`];
      }

      default:
        throw new BadRequestException('Tipo de capa INEGI no soportado');
    }
  }

  async buscar(
    tipo: TipoCapaInegi,
    query: string,
    ent?: string,
    mun?: string,
    loc?: string,
  ): Promise<ResultadoBusquedaInegi[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('La búsqueda debe tener al menos 2 caracteres');
    }

    const termino = query.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const resultados: ResultadoBusquedaInegi[] = [];

    switch (tipo) {
      case 'estados': {
        const geo = await this.descargar('estados');
        resultados.push(...this.filtrarFeatures(geo, termino, 'estados'));
        break;
      }

      case 'municipios': {
        if (!ent) {
          throw new BadRequestException('Para buscar municipios se requiere una clave de estado (2 dígitos)');
        }
        const geo = await this.descargar('municipios', ent);
        resultados.push(...this.filtrarFeatures(geo, termino, 'municipios', ent));
        break;
      }

      case 'localidades': {
        if (!ent || !mun) {
          throw new BadRequestException('Para buscar localidades se requiere estado y municipio');
        }
        const geo = await this.descargar('localidades', `${ent}${mun}`);
        resultados.push(...this.filtrarFeatures(geo, termino, 'localidades', ent, mun));
        break;
      }

      case 'ageb': {
        if (!ent || !mun) {
          throw new BadRequestException('Para buscar AGEB se requiere estado y municipio');
        }
        const geo = await this.descargar('ageb', `${ent}${mun}`);
        resultados.push(...this.filtrarFeatures(geo, termino, 'ageb', ent, mun));
        break;
      }

      case 'manzanas': {
        if (!ent || !mun || !loc) {
          throw new BadRequestException('Para buscar manzanas se requiere estado, municipio y localidad');
        }
        const geo = await this.descargar('manzanas', `${ent}${mun}${loc}`);
        resultados.push(...this.filtrarFeatures(geo, termino, 'manzanas', ent, mun, loc));
        break;
      }

      case 'vialidades': {
        if (!ent || !mun) {
          throw new BadRequestException('Para buscar vialidades se requiere estado y municipio');
        }
        const geo = await this.descargar('vialidades', `${ent}${mun}`);
        resultados.push(...this.filtrarFeatures(geo, termino, 'vialidades', ent, mun));
        break;
      }

      default:
        throw new BadRequestException(`Búsqueda no soportada para el tipo: ${tipo}`);
    }

    return resultados.slice(0, 50);
  }

  async obtenerPorClave(
    tipo: TipoCapaInegi,
    clave: string,
    ent?: string,
    mun?: string,
    loc?: string,
  ): Promise<any> {
    let geo: any;
    switch (tipo) {
      case 'estados':
        geo = await this.descargar('estados', clave);
        break;
      case 'municipios':
        if (!ent) throw new BadRequestException('Se requiere estado para importar municipio');
        geo = await this.descargar('municipios', clave);
        break;
      case 'localidades':
        if (!ent || !mun) throw new BadRequestException('Se requiere estado y municipio para importar localidad');
        geo = await this.descargar('localidades', `${ent}${mun}`);
        break;
      case 'ageb':
        if (!ent || !mun) throw new BadRequestException('Se requiere estado y municipio para importar AGEB');
        geo = await this.descargar('ageb', `${ent}${mun}`);
        break;
      case 'manzanas':
        if (!ent || !mun || !loc) throw new BadRequestException('Se requiere estado, municipio y localidad para importar manzana');
        geo = await this.descargar('manzanas', `${ent}${mun}${loc}`);
        break;
      case 'vialidades':
        if (!ent || !mun) throw new BadRequestException('Se requiere estado y municipio para importar vialidades');
        geo = await this.descargar('vialidades', `${ent}${mun}`);
        break;
      default:
        throw new BadRequestException('Tipo no soportado');
    }

    const features = geo?.features || [];
    const claveLimpia = String(clave).trim();
    const claveLimpiaUpper = claveLimpia.toUpperCase();
    const claveLimpiaLower = claveLimpia.toLowerCase();
    const feature = features.find((f: any) => {
      const p = f.properties || {};
      const cve = String(
        p.cvegeo || p.CVEGEO || p.cve_ent || p.CVE_ENT || p.cve_mun || p.CVE_MUN || p.cve_loc || p.CVE_LOC || p.cve_ageb || p.CVE_AGEB || p.cve_mza || p.CVE_MZA || '',
      ).trim();
      const cveUpper = cve.toUpperCase();
      const cveLower = cve.toLowerCase();
      // Coincidencia exacta o por sufijo/prefijo (útil para AGEB con letras y manzanas)
      return (
        cve === claveLimpia ||
        cveUpper === claveLimpiaUpper ||
        cveLower === claveLimpiaLower ||
        cveUpper.endsWith(claveLimpiaUpper) ||
        claveLimpiaUpper.endsWith(cveUpper)
      );
    });

    if (!feature) {
      throw new BadRequestException(`No se encontró ${tipo} con clave ${clave}`);
    }

    return {
      type: 'FeatureCollection',
      features: [feature],
    };
  }

  private filtrarFeatures(
    geo: any,
    termino: string,
    tipo: TipoCapaInegi,
    ent?: string,
    mun?: string,
    loc?: string,
  ): ResultadoBusquedaInegi[] {
    const features = geo?.features || [];
    return features
      .filter((f: any) => {
        const p = f.properties || {};
        const nombre = String(
          p.nom_loc || p.NOM_LOC ||
          p.nomgeo || p.NOMGEO ||
          p.NOMBRE || p.nombre ||
          p.nom_ageb || p.NOM_AGEB ||
          p.nom_vial || p.NOM_VIAL ||
          ''
        ).toLowerCase();
        const normalizado = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '');
        return normalizado.includes(termino) || nombre.includes(termino);
      })
      .map((f: any) => {
        const p = f.properties || {};
        const clave = String(
          p.cvegeo || p.CVEGEO || p.cve_ent || p.CVE_ENT || p.cve_mun || p.CVE_MUN || p.cve_loc || p.CVE_LOC || p.cve_ageb || p.CVE_AGEB || p.cve_mza || p.CVE_MZA || '',
        );
        const nombre =
          p.nom_loc || p.NOM_LOC ||
          p.nomgeo || p.NOMGEO ||
          p.NOMBRE || p.nombre ||
          p.nom_ageb || p.NOM_AGEB ||
          p.nom_vial || p.NOM_VIAL ||
          `Sin nombre (${clave})`;
        return {
          clave,
          nombre,
          tipo,
          entidad: ent,
          municipio: mun,
          localidad: loc,
          feature: f,
        };
      });
  }

  private limpiarClave(clave?: string): string {
    return (clave || '').replace(/\D/g, '');
  }

  private partes(clave?: string): ClavePartes {
    const c = this.limpiarClave(clave);
    if (!c) return { ent: '', mun: '', loc: '' };

    // Si la clave tiene 5 dígitos o menos: ent(2) + mun(3)
    // Si tiene más de 5: ent(2) + mun(3) + loc(4)
    const padded = c.length <= 5 ? c.padStart(5, '0') : c.padStart(9, '0');
    return {
      ent: padded.slice(0, 2),
      mun: padded.slice(2, 5),
      loc: padded.slice(5, 9),
    };
  }
}
