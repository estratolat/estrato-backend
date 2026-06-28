import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export interface ResultadoColonia {
  id: string;
  nombre: string;
  tipo: string;
  direccion: string;
  lat: number;
  lon: number;
  geojson: any;
}

@Injectable()
export class NominatimService {
  private readonly logger = new Logger(NominatimService.name);
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpService) {}

  async buscar(
    query: string,
    entidad?: string,
    municipio?: string,
  ): Promise<ResultadoColonia[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('La búsqueda debe tener al menos 2 caracteres');
    }

    // Construir query enriquecido con estado/municipio para mejorar precisión
    let q = query.trim();
    const partes: string[] = [];
    if (municipio) partes.push(municipio);
    if (entidad) partes.push(entidad);
    if (partes.length) q += `, ${partes.join(', ')}, México`;
    else q += ', México';

    const url = `${this.baseUrl}`;
    const params = {
      q,
      format: 'geojson',
      polygon_geojson: 1,
      addressdetails: 1,
      countrycodes: 'mx',
      limit: 25,
    };

    this.logger.debug(`Consultando Nominatim: ${url} q=${q}`);

    try {
      const response = await lastValueFrom(
        this.http.get(url, {
          params,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'ESTRATO SaaS / contacto@estrato.mx',
          },
          timeout: 30000,
        }),
      );

      const features = response.data?.features || [];
      this.logger.debug(`Nominatim devolvió ${features.length} resultados para "${q}"`);

      return features
        .filter((f: any) => {
          const type = f.properties?.type?.toLowerCase() || '';
          const category = f.properties?.category?.toLowerCase() || '';
          // Filtrar por tipos relevantes de colonia/asentamiento
          const relevantes = [
            'suburb', 'neighbourhood', 'residential', 'quarter',
            'hamlet', 'village', 'town', 'city',
            'place', 'locality', 'allotments',
          ];
          return relevantes.some((r) => type.includes(r) || category.includes(r));
        })
        .map((f: any) => {
          const props = f.properties || {};
          const nombre = props.namedetails?.name ||
            props.display_name?.split(',')[0] ||
            query.trim();
          return {
            id: `${props.osm_type || 'way'}_${props.osm_id || 0}`,
            nombre,
            tipo: props.type || props.category || 'colonia',
            direccion: props.display_name || '',
            lat: parseFloat(props.lat) || 0,
            lon: parseFloat(props.lon) || 0,
            geojson: f.geometry,
          };
        })
        .slice(0, 20);
    } catch (err: any) {
      this.logger.error(`Error consultando Nominatim: ${err?.message}`, err?.response?.status);
      throw new BadRequestException(`Error al consultar Nominatim: ${err?.message || 'Sin respuesta'}`);
    }
  }
}
