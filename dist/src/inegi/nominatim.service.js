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
var NominatimService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NominatimService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let NominatimService = NominatimService_1 = class NominatimService {
    constructor(http) {
        this.http = http;
        this.logger = new common_1.Logger(NominatimService_1.name);
        this.baseUrl = 'https://nominatim.openstreetmap.org/search';
    }
    async buscar(query, entidad, municipio) {
        if (!query || query.trim().length < 2) {
            throw new common_1.BadRequestException('La búsqueda debe tener al menos 2 caracteres');
        }
        let q = query.trim();
        const partes = [];
        if (municipio)
            partes.push(municipio);
        if (entidad)
            partes.push(entidad);
        if (partes.length)
            q += `, ${partes.join(', ')}, México`;
        else
            q += ', México';
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
            const response = await (0, rxjs_1.lastValueFrom)(this.http.get(url, {
                params,
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'ESTRATO SaaS / contacto@estrato.mx',
                },
                timeout: 30000,
            }));
            const features = response.data?.features || [];
            this.logger.debug(`Nominatim devolvió ${features.length} resultados para "${q}"`);
            return features
                .filter((f) => {
                const type = f.properties?.type?.toLowerCase() || '';
                const category = f.properties?.category?.toLowerCase() || '';
                const relevantes = [
                    'suburb', 'neighbourhood', 'residential', 'quarter',
                    'hamlet', 'village', 'town', 'city',
                    'place', 'locality', 'allotments',
                ];
                return relevantes.some((r) => type.includes(r) || category.includes(r));
            })
                .map((f) => {
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
        }
        catch (err) {
            this.logger.error(`Error consultando Nominatim: ${err?.message}`, err?.response?.status);
            throw new common_1.BadRequestException(`Error al consultar Nominatim: ${err?.message || 'Sin respuesta'}`);
        }
    }
};
exports.NominatimService = NominatimService;
exports.NominatimService = NominatimService = NominatimService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], NominatimService);
//# sourceMappingURL=nominatim.service.js.map