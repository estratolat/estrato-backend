import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ResultadoColonia } from './colonias.service';

export type FuenteColonia = 'nominatim' | 'sepomex';

@Injectable()
export class ColoniasNominatimService {
  private readonly logger = new Logger(ColoniasNominatimService.name);
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpService) {}

  async buscar(
    query: string,
    estado?: string,
    municipio?: string,
  ): Promise<ResultadoColonia[]> {
    if (!query || query.trim().length < 2) return [];

    const partes = [query.trim()];
    if (municipio) partes.push(municipio);
    if (estado) partes.push(estado);
    partes.push('México');
    const q = partes.join(', ');

    this.logger.debug(`Nominatim: ${q}`);

    try {
      const response = await lastValueFrom(
        this.http.get(this.baseUrl, {
          params: {
            q,
            format: 'geojson',
            polygon_geojson: 1,
            addressdetails: 1,
            countrycodes: 'mx',
            limit: 20,
          },
          headers: {
            Accept: 'application/json',
            'User-Agent': 'ESTRATO SaaS / contacto@estrato.mx',
          },
          timeout: 30000,
        }),
      );

      const features = response.data?.features || [];
      this.logger.debug(`Nominatim devolvió ${features.length} resultados`);

      const resultados: ResultadoColonia[] = [];

      for (const f of features) {
        const props = f.properties || {};
        const geometry = f.geometry;
        if (!geometry) continue;

        const tipo = props.type?.toLowerCase?.() || props.category?.toLowerCase?.() || '';
        const relevantes = [
          'suburb', 'neighbourhood', 'residential', 'quarter',
          'hamlet', 'village', 'town', 'city', 'place', 'locality', 'allotments',
        ];

        if (!relevantes.some((r) => tipo.includes(r))) continue;

        // Descartar resultados que solo sean puntos: no nos dan el trazo.
        if (geometry.type === 'Point') continue;

        const display = props.display_name || '';
        const nombre =
          props.namedetails?.name ||
          display.split(',')[0] ||
          query.trim();

        const address = props.address || {};
        const estadoNom = address.state || address.county || '';
        const municipioNom = address.county || address.city || address.town || address.municipality || '';
        const cp = address.postcode || '';

        const id = `nominatim_${props.osm_type || 'way'}_${props.osm_id || 0}`;

        resultados.push({
          id,
          nombre,
          tipo: props.type || props.category || 'colonia',
          codigo_postal: cp,
          municipio: municipioNom,
          estado: estadoNom,
          estado_id: '',
          direccion: display,
          geojson: geometry,
          fuente: 'nominatim',
          aproximado: false,
        });
      }

      return resultados.slice(0, 10);
    } catch (err: any) {
      this.logger.warn(`Nominatim falló: ${err?.message}`);
      return [];
    }
  }
}
