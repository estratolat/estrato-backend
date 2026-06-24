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
var InegiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InegiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let InegiService = InegiService_1 = class InegiService {
    constructor(http) {
        this.http = http;
        this.logger = new common_1.Logger(InegiService_1.name);
        this.baseUrl = 'https://gaia.inegi.org.mx/wscatgeo/v2/geo';
    }
    async descargar(tipo, clave) {
        const urls = this.buildUrls(tipo, clave);
        const results = await Promise.all(urls.map((url) => this.fetchJson(url)));
        const features = results.flatMap((r) => r?.features || []);
        const metadatos = results.map((r) => r?.metadatos).filter(Boolean);
        if (features.length === 0) {
            throw new common_1.BadRequestException(`La capa ${tipo} no devolvió polígonos para la clave ${clave || '(vacía)'}. Verifica la clave en el INEGI.`);
        }
        return {
            type: 'FeatureCollection',
            features,
            metadatos,
        };
    }
    async fetchJson(url) {
        this.logger.debug(`Consultando INEGI: ${url}`);
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.http.get(url, {
                headers: { Accept: 'application/json' },
                timeout: 60000,
            }));
            return response.data;
        }
        catch (err) {
            this.logger.error(`Error consultando INEGI ${url}: ${err?.message}`, err?.response?.status);
            throw new common_1.BadRequestException(`Error del servicio del INEGI: ${err?.message || 'Sin respuesta'}`);
        }
    }
    buildUrls(tipo, clave) {
        const c = this.limpiarClave(clave);
        switch (tipo) {
            case 'estados':
                return [`${this.baseUrl}/mgee/${c}`];
            case 'municipios': {
                if (c.length >= 5) {
                    const p = this.partes(c);
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
                    throw new common_1.BadRequestException('Se requiere clave de municipio (5 dígitos) o localidad (9 dígitos) para localidades');
                }
                return [
                    `${this.baseUrl}/localidades/pol/${p.ent}/${p.mun}/U`,
                    `${this.baseUrl}/localidades/pol/${p.ent}/${p.mun}/R`,
                ];
            }
            case 'ageb': {
                const p = this.partes(c);
                if (!p.ent || !p.mun) {
                    throw new common_1.BadRequestException('Se requiere clave de municipio (5 dígitos) para AGEB');
                }
                return [`${this.baseUrl}/agebu/${p.ent}/${p.mun}`];
            }
            case 'manzanas': {
                const p = this.partes(c);
                if (!p.ent || !p.mun || !p.loc) {
                    throw new common_1.BadRequestException('Se requiere clave de localidad (9 dígitos) para manzanas');
                }
                return [`${this.baseUrl}/mza/${p.ent}/${p.mun}/${p.loc}/U`];
            }
            case 'vialidades': {
                const p = this.partes(c);
                if (!p.ent || !p.mun) {
                    throw new common_1.BadRequestException('Se requiere clave de municipio (5 dígitos) para vialidades');
                }
                return [`${this.baseUrl}/vialidades/${p.ent}/${p.mun}`];
            }
            default:
                throw new common_1.BadRequestException('Tipo de capa INEGI no soportado');
        }
    }
    limpiarClave(clave) {
        return (clave || '').replace(/\D/g, '');
    }
    partes(clave) {
        const c = this.limpiarClave(clave);
        if (!c)
            return { ent: '', mun: '', loc: '' };
        const padded = c.length <= 5 ? c.padStart(5, '0') : c.padStart(9, '0');
        return {
            ent: padded.slice(0, 2),
            mun: padded.slice(2, 5),
            loc: padded.slice(5, 9),
        };
    }
};
exports.InegiService = InegiService;
exports.InegiService = InegiService = InegiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], InegiService);
//# sourceMappingURL=inegi.service.js.map