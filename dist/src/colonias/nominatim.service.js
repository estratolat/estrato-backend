"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ColoniasNominatimService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColoniasNominatimService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let ColoniasNominatimService = ColoniasNominatimService_1 = class ColoniasNominatimService {
    constructor(http) {
        this.http = http;
        this.logger = new common_1.Logger(ColoniasNominatimService_1.name);
        this.baseUrl = 'https://nominatim.openstreetmap.org/search';
    }
    async buscar(query, estado, municipio) {
        if (!query || query.trim().length < 2)
            return [];
        const partes = [query.trim()];
        if (municipio)
            partes.push(municipio);
        if (estado)
            partes.push(estado);
        partes.push('México');
        const q = partes.join(', ');
        this.logger.debug(`Nominatim: ${q}`);
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.http.get(this.baseUrl, {
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
            }));
            const features = response.data?.features || [];
            this.logger.debug(`Nominatim devolvió ${features.length} resultados`);
            const resultados = [];
            for (const f of features) {
                const props = f.properties || {};
                const geometry = f.geometry;
                if (!geometry)
                    continue;
                const tipo = props.type?.toLowerCase?.() || props.category?.toLowerCase?.() || '';
                const relevantes = [
                    'suburb', 'neighbourhood', 'residential', 'quarter',
                    'hamlet', 'village', 'town', 'city', 'place', 'locality', 'allotments',
                ];
                if (!relevantes.some((r) => tipo.includes(r)))
                    continue;
                if (geometry.type === 'Point')
                    continue;
                const display = props.display_name || '';
                const nombre = props.namedetails?.name ||
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
        }
        catch (err) {
            this.logger.warn(`Nominatim falló: ${err?.message}`);
            return [];
        }
    }
};
exports.ColoniasNominatimService = ColoniasNominatimService;
exports.ColoniasNominatimService = ColoniasNominatimService = ColoniasNominatimService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ColoniasNominatimService);
//# sourceMappingURL=nominatim.service.js.map