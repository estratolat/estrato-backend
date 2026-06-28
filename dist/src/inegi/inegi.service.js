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
    async buscar(tipo, query, ent, mun, loc) {
        if (!query || query.trim().length < 2) {
            throw new common_1.BadRequestException('La búsqueda debe tener al menos 2 caracteres');
        }
        const termino = query.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const resultados = [];
        switch (tipo) {
            case 'estados': {
                const geo = await this.descargar('estados');
                resultados.push(...this.filtrarFeatures(geo, termino, 'estados'));
                break;
            }
            case 'municipios': {
                if (!ent) {
                    throw new common_1.BadRequestException('Para buscar municipios se requiere una clave de estado (2 dígitos)');
                }
                const geo = await this.descargar('municipios', ent);
                resultados.push(...this.filtrarFeatures(geo, termino, 'municipios', ent));
                break;
            }
            case 'localidades': {
                if (!ent || !mun) {
                    throw new common_1.BadRequestException('Para buscar localidades se requiere estado y municipio');
                }
                const geo = await this.descargar('localidades', `${ent}${mun}`);
                resultados.push(...this.filtrarFeatures(geo, termino, 'localidades', ent, mun));
                break;
            }
            case 'ageb': {
                if (!ent || !mun) {
                    throw new common_1.BadRequestException('Para buscar AGEB se requiere estado y municipio');
                }
                const geo = await this.descargar('ageb', `${ent}${mun}`);
                resultados.push(...this.filtrarFeatures(geo, termino, 'ageb', ent, mun));
                break;
            }
            case 'manzanas': {
                if (!ent || !mun || !loc) {
                    throw new common_1.BadRequestException('Para buscar manzanas se requiere estado, municipio y localidad');
                }
                const geo = await this.descargar('manzanas', `${ent}${mun}${loc}`);
                resultados.push(...this.filtrarFeatures(geo, termino, 'manzanas', ent, mun, loc));
                break;
            }
            case 'vialidades': {
                if (!ent || !mun) {
                    throw new common_1.BadRequestException('Para buscar vialidades se requiere estado y municipio');
                }
                const geo = await this.descargar('vialidades', `${ent}${mun}`);
                resultados.push(...this.filtrarFeatures(geo, termino, 'vialidades', ent, mun));
                break;
            }
            default:
                throw new common_1.BadRequestException(`Búsqueda no soportada para el tipo: ${tipo}`);
        }
        return resultados.slice(0, 50);
    }
    async obtenerPorClave(tipo, clave, ent, mun, loc) {
        let geo;
        switch (tipo) {
            case 'estados':
                geo = await this.descargar('estados', clave);
                break;
            case 'municipios':
                if (!ent)
                    throw new common_1.BadRequestException('Se requiere estado para importar municipio');
                geo = await this.descargar('municipios', clave);
                break;
            case 'localidades':
                if (!ent || !mun)
                    throw new common_1.BadRequestException('Se requiere estado y municipio para importar localidad');
                geo = await this.descargar('localidades', `${ent}${mun}`);
                break;
            case 'ageb':
                if (!ent || !mun)
                    throw new common_1.BadRequestException('Se requiere estado y municipio para importar AGEB');
                geo = await this.descargar('ageb', `${ent}${mun}`);
                break;
            case 'manzanas':
                if (!ent || !mun || !loc)
                    throw new common_1.BadRequestException('Se requiere estado, municipio y localidad para importar manzana');
                geo = await this.descargar('manzanas', `${ent}${mun}${loc}`);
                break;
            case 'vialidades':
                if (!ent || !mun)
                    throw new common_1.BadRequestException('Se requiere estado y municipio para importar vialidades');
                geo = await this.descargar('vialidades', `${ent}${mun}`);
                break;
            default:
                throw new common_1.BadRequestException('Tipo no soportado');
        }
        const features = geo?.features || [];
        const claveLimpia = String(clave).trim();
        const claveLimpiaUpper = claveLimpia.toUpperCase();
        const claveLimpiaLower = claveLimpia.toLowerCase();
        const feature = features.find((f) => {
            const p = f.properties || {};
            const cve = String(p.cvegeo || p.CVEGEO || p.cve_ent || p.CVE_ENT || p.cve_mun || p.CVE_MUN || p.cve_loc || p.CVE_LOC || p.cve_ageb || p.CVE_AGEB || p.cve_mza || p.CVE_MZA || '').trim();
            const cveUpper = cve.toUpperCase();
            const cveLower = cve.toLowerCase();
            return (cve === claveLimpia ||
                cveUpper === claveLimpiaUpper ||
                cveLower === claveLimpiaLower ||
                cveUpper.endsWith(claveLimpiaUpper) ||
                claveLimpiaUpper.endsWith(cveUpper));
        });
        if (!feature) {
            throw new common_1.BadRequestException(`No se encontró ${tipo} con clave ${clave}`);
        }
        return {
            type: 'FeatureCollection',
            features: [feature],
        };
    }
    filtrarFeatures(geo, termino, tipo, ent, mun, loc) {
        const features = geo?.features || [];
        return features
            .filter((f) => {
            const p = f.properties || {};
            const nombre = String(p.nom_loc || p.NOM_LOC ||
                p.nomgeo || p.NOMGEO ||
                p.NOMBRE || p.nombre ||
                p.nom_ageb || p.NOM_AGEB ||
                p.nom_vial || p.NOM_VIAL ||
                '').toLowerCase();
            const normalizado = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '');
            return normalizado.includes(termino) || nombre.includes(termino);
        })
            .map((f) => {
            const p = f.properties || {};
            const clave = String(p.cvegeo || p.CVEGEO || p.cve_ent || p.CVE_ENT || p.cve_mun || p.CVE_MUN || p.cve_loc || p.CVE_LOC || p.cve_ageb || p.CVE_AGEB || p.cve_mza || p.CVE_MZA || '');
            const nombre = p.nom_loc || p.NOM_LOC ||
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