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
var InegiWmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InegiWmsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let InegiWmsService = InegiWmsService_1 = class InegiWmsService {
    constructor(http) {
        this.http = http;
        this.logger = new common_1.Logger(InegiWmsService_1.name);
        this.endpoint = 'https://gaia.inegi.org.mx/NLB/mdm5.wms';
        this.layerNames = {
            estados: { layer: 'Límite_geoestadístico_estatal', style: '', cqlField: 'CVE_ENT' },
            municipios: { layer: 'Límite_geoestadístico_municipal', style: '', cqlField: 'CVE_MUN' },
            localidades: { layer: 'Localidad_urbana_y_rural_amanzanada', style: '', cqlField: 'CVE_LOC' },
            ageb: { layer: 'AGEB_urbanas', style: '', cqlField: 'CVE_AGEB' },
            manzanas: { layer: 'Manzanas', style: '', cqlField: 'CVE_MZA' },
            vialidades: { layer: 'Vialidades', style: '', cqlField: '' },
        };
    }
    async proxyTile(params, res) {
        const config = this.layerNames[params.capa];
        if (!config) {
            throw new common_1.BadRequestException('Capa INEGI no soportada');
        }
        const query = new URLSearchParams();
        query.set('Request', 'GetMap');
        query.set('Service', 'WMS');
        query.set('Version', params.version || '1.1.1');
        query.set('Layers', config.layer);
        query.set('Styles', params.styles || config.style);
        query.set('Format', params.format || 'image/png');
        query.set('Transparent', params.transparent || 'true');
        query.set('SRS', params.srs || 'EPSG:3857');
        query.set('BBOX', params.bbox);
        query.set('WIDTH', params.width || '256');
        query.set('HEIGHT', params.height || '256');
        query.set('TILED', 'true');
        const cql = this.buildCql(config.cqlField, params.cve, params.capa);
        if (cql) {
            query.set('CQL_FILTER', cql);
        }
        const url = `${this.endpoint}?${query.toString()}`;
        this.logger.debug(`Proxy INEGI WMS: ${url}`);
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.http.get(url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: { Accept: 'image/png,image/*' },
            }));
            const contentType = typeof response.headers['content-type'] === 'string'
                ? response.headers['content-type']
                : 'image/png';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.status(200).send(response.data);
        }
        catch (err) {
            this.logger.error(`Error proxy INEGI WMS: ${err?.message}`, err?.response?.status, url);
            throw new common_1.BadRequestException('No se pudo obtener la capa del INEGI');
        }
    }
    buildCql(field, cve, capa) {
        if (!field || !cve)
            return '';
        const clean = String(cve).replace(/\D/g, '');
        if (!clean)
            return '';
        if (capa === 'estados' && clean.length === 2) {
            return `${field}='${clean}'`;
        }
        if (capa === 'municipios') {
            if (clean.length === 5)
                return `CVEGEO='${clean}'`;
            if (clean.length === 2)
                return `${field}='${clean.padStart(3, '0')}' OR CVE_ENT='${clean}'`;
            return `${field}='${clean.padStart(3, '0')}'`;
        }
        if (capa === 'localidades') {
            if (clean.length >= 9)
                return `CVEGEO='${clean.slice(0, 9)}'`;
            if (clean.length === 5) {
                const ent = clean.slice(0, 2);
                const mun = clean.slice(2, 5);
                return `CVE_ENT='${ent}' AND CVE_MUN='${mun}'`;
            }
            return `${field}='${clean.padStart(4, '0')}'`;
        }
        if (capa === 'ageb') {
            if (clean.length >= 5) {
                const ent = clean.slice(0, 2);
                const mun = clean.slice(2, 5);
                return `CVE_ENT='${ent}' AND CVE_MUN='${mun}'`;
            }
            return '';
        }
        if (capa === 'manzanas') {
            if (clean.length >= 9) {
                const ent = clean.slice(0, 2);
                const mun = clean.slice(2, 5);
                const loc = clean.slice(5, 9);
                return `CVE_ENT='${ent}' AND CVE_MUN='${mun}' AND CVE_LOC='${loc}'`;
            }
            return '';
        }
        return `${field}='${clean}'`;
    }
};
exports.InegiWmsService = InegiWmsService;
exports.InegiWmsService = InegiWmsService = InegiWmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], InegiWmsService);
//# sourceMappingURL=inegi-wms.service.js.map