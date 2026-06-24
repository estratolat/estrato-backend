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
