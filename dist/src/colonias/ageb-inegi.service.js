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
var AgebInegiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgebInegiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const geo_utils_1 = require("./geo-utils");
let AgebInegiService = AgebInegiService_1 = class AgebInegiService {
    constructor(http) {
        this.http = http;
        this.logger = new common_1.Logger(AgebInegiService_1.name);
        this.baseUrl = 'https://gaia.inegi.org.mx/wscatgeo/v2';
        this.cache = {};
        this.ttlMs = 1000 * 60 * 60 * 6;
    }
    async buscarClaveMunicipio(cveEnt, nombreMunicipio) {
        try {
            const url = `${this.baseUrl}/geo/municipios/${cveEnt}`;
            this.logger.debug(`Descargando municipios: ${url}`);
            const response = await (0, rxjs_1.lastValueFrom)(this.http.get(url, { timeout: 60000 }));
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
        }
        catch (err) {
            this.logger.warn(`No se pudieron cargar municipios de INEGI: ${err.message}`);
            return null;
        }
    }
    async buscarAgebs(cveEnt, cveMun) {
        const clave = `${cveEnt}_${cveMun}`;
        const cached = this.cache[clave];
        if (cached && cached.expira > Date.now()) {
            return cached.features;
        }
        try {
            const url = `${this.baseUrl}/geo/agebu/${cveEnt}/${cveMun}`;
            this.logger.debug(`Descargando AGEBs: ${url}`);
            const response = await (0, rxjs_1.lastValueFrom)(this.http.get(url, { timeout: 120000 }));
            const features = (response.data?.features || []);
            this.cache[clave] = { features, expira: Date.now() + this.ttlMs };
            this.logger.log(`AGEBs cargadas para ${clave}: ${features.length}`);
            return features;
        }
        catch (err) {
            this.logger.warn(`Error descargando AGEBs ${clave}: ${err.message}`);
            return [];
        }
    }
    async agebsCercanas(cveEnt, cveMun, punto, radioKm = 0.6, maxResultados = 3) {
        const agebs = await this.buscarAgebs(cveEnt, cveMun);
        const conDistancia = agebs
            .map((f) => {
            const c = (0, geo_utils_1.centroide)(f.geometry);
            return {
                feature: f,
                distancia: c ? (0, geo_utils_1.distanciaKm)(punto, c) : Infinity,
            };
        })
            .filter((x) => x.distancia <= radioKm)
            .sort((a, b) => a.distancia - b.distancia)
            .slice(0, maxResultados);
        return conDistancia.map((x) => x.feature);
    }
    normalizar(texto) {
        return String(texto || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
};
exports.AgebInegiService = AgebInegiService;
exports.AgebInegiService = AgebInegiService = AgebInegiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], AgebInegiService);
//# sourceMappingURL=ageb-inegi.service.js.map