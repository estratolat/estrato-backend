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
var SepomexCatalogoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SepomexCatalogoService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let SepomexCatalogoService = SepomexCatalogoService_1 = class SepomexCatalogoService {
    constructor(http) {
        this.http = http;
        this.logger = new common_1.Logger(SepomexCatalogoService_1.name);
        this.url = 'https://www.correosdemexico.gob.mx/datosabiertos/cp/cpdescarga.txt';
        this.cache = {};
    }
    async buscar(query, estadoNombre, municipioNombre) {
        await this.cargar();
        const termino = this.normalizar(query);
        return Object.values(this.cache)
            .flat()
            .filter((a) => {
            const coincide = this.normalizar(a.nombre).includes(termino) ||
                a.codigo === query.trim() ||
                this.normalizar(a.ciudad || '').includes(termino);
            if (!coincide)
                return false;
            if (estadoNombre) {
                const estadoTermino = this.normalizar(estadoNombre);
                if (!this.normalizar(a.estado).includes(estadoTermino))
                    return false;
            }
            if (municipioNombre) {
                const munTermino = this.normalizar(municipioNombre);
                if (!this.normalizar(a.municipio).includes(munTermino))
                    return false;
            }
            return true;
        })
            .slice(0, 100);
    }
    async buscarPorCp(cp) {
        await this.cargar();
        return this.cache[cp] || [];
    }
    async cargar() {
        if (Object.keys(this.cache).length > 0)
            return;
        try {
            this.logger.log('Descargando catálogo SEPOMEX...');
            const response = await (0, rxjs_1.lastValueFrom)(this.http.get(this.url, {
                responseType: 'arraybuffer',
                timeout: 60000,
            }));
            const texto = Buffer.from(response.data).toString('latin1');
            this.cache = this.parsear(texto);
            const total = Object.values(this.cache).flat().length;
            this.logger.log(`Catálogo SEPOMEX cargado: ${total} asentamientos`);
        }
        catch (err) {
            this.logger.error(`Error cargando catálogo SEPOMEX: ${err?.message}`);
            this.cache = {};
        }
    }
    parsear(texto) {
        const lineas = texto.split(/\r?\n/);
        const mapa = {};
        for (const linea of lineas) {
            if (!linea.trim() || linea.startsWith('#'))
                continue;
            const partes = linea.split('|');
            if (partes.length < 7)
                continue;
            const codigo = partes[0]?.trim();
            const colonia = partes[1]?.trim();
            const tipo = partes[2]?.trim();
            const municipio = partes[3]?.trim();
            const estado = partes[4]?.trim();
            const ciudad = partes[5]?.trim();
            if (!codigo || !colonia)
                continue;
            const item = {
                codigo,
                nombre: colonia,
                tipo,
                municipio,
                estado,
                ciudad,
            };
            if (!mapa[codigo])
                mapa[codigo] = [];
            mapa[codigo].push(item);
        }
        return mapa;
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
exports.SepomexCatalogoService = SepomexCatalogoService;
exports.SepomexCatalogoService = SepomexCatalogoService = SepomexCatalogoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], SepomexCatalogoService);
//# sourceMappingURL=sepomex-catalogo.service.js.map