import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export interface AsentamientoSepomex {
  codigo: string;
  nombre: string;
  tipo: string;
  municipio: string;
  estado: string;
  ciudad?: string;
}

@Injectable()
export class SepomexCatalogoService {
  private readonly logger = new Logger(SepomexCatalogoService.name);
  private readonly url = 'https://www.correosdemexico.gob.mx/datosabiertos/cp/cpdescarga.txt';
  private cache: Record<string, AsentamientoSepomex[]> = {};

  constructor(private http: HttpService) {}

  async buscar(
    query: string,
    estadoNombre?: string,
    municipioNombre?: string,
  ): Promise<AsentamientoSepomex[]> {
    await this.cargar();
    const termino = this.normalizar(query);

    return Object.values(this.cache)
      .flat()
      .filter((a) => {
        const coincide =
          this.normalizar(a.nombre).includes(termino) ||
          a.codigo === query.trim() ||
          this.normalizar(a.ciudad || '').includes(termino);

        if (!coincide) return false;

        if (estadoNombre) {
          const estadoTermino = this.normalizar(estadoNombre);
          if (!this.normalizar(a.estado).includes(estadoTermino)) return false;
        }

        if (municipioNombre) {
          const munTermino = this.normalizar(municipioNombre);
          if (!this.normalizar(a.municipio).includes(munTermino)) return false;
        }

        return true;
      })
      .slice(0, 100);
  }

  async buscarPorCp(cp: string): Promise<AsentamientoSepomex[]> {
    await this.cargar();
    return this.cache[cp] || [];
  }

  private async cargar() {
    if (Object.keys(this.cache).length > 0) return;

    try {
      this.logger.log('Descargando catálogo SEPOMEX...');
      const response = await lastValueFrom(
        this.http.get(this.url, {
          responseType: 'arraybuffer',
          timeout: 60000,
        }),
      );
      const texto = Buffer.from(response.data as ArrayBuffer).toString('latin1');
      this.cache = this.parsear(texto);
      const total = Object.values(this.cache).flat().length;
      this.logger.log(`Catálogo SEPOMEX cargado: ${total} asentamientos`);
    } catch (err: any) {
      this.logger.error(`Error cargando catálogo SEPOMEX: ${err?.message}`);
      this.cache = {};
    }
  }

  private parsear(texto: string): Record<string, AsentamientoSepomex[]> {
    const lineas = texto.split(/\r?\n/);
    const mapa: Record<string, AsentamientoSepomex[]> = {};

    for (const linea of lineas) {
      if (!linea.trim() || linea.startsWith('#')) continue;
      const partes = linea.split('|');
      if (partes.length < 7) continue;

      const codigo = partes[0]?.trim();
      const colonia = partes[1]?.trim();
      const tipo = partes[2]?.trim();
      const municipio = partes[3]?.trim();
      const estado = partes[4]?.trim();
      const ciudad = partes[5]?.trim();

      if (!codigo || !colonia) continue;

      const item: AsentamientoSepomex = {
        codigo,
        nombre: colonia,
        tipo,
        municipio,
        estado,
        ciudad,
      };

      if (!mapa[codigo]) mapa[codigo] = [];
      mapa[codigo].push(item);
    }

    return mapa;
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
