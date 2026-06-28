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
var ColoniasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColoniasService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const sepomex_catalogo_service_1 = require("./sepomex-catalogo.service");
const nominatim_service_1 = require("./nominatim.service");
const ageb_inegi_service_1 = require("./ageb-inegi.service");
const geo_utils_1 = require("./geo-utils");
let ColoniasService = ColoniasService_1 = class ColoniasService {
    constructor(http, sepomex, nominatim, agebInegi) {
        this.http = http;
        this.sepomex = sepomex;
        this.nominatim = nominatim;
        this.agebInegi = agebInegi;
        this.logger = new common_1.Logger(ColoniasService_1.name);
        this.baseUrl = 'https://raw.githubusercontent.com/open-mexico/mexico-geojson/main';
        this.cache = {};
        this.ESTADO_CLAVE = {
            aguascalientes: '01',
            'baja california': '02',
            'baja california sur': '03',
            campeche: '04',
            coahuila: '05',
            'coahuila de zaragoza': '05',
            colima: '06',
            chiapas: '07',
            chihuahua: '08',
            'ciudad de mexico': '09',
            cdmx: '09',
            durango: '10',
            guanajuato: '11',
            guerrero: '12',
            hidalgo: '13',
            jalisco: '14',
            mexico: '15',
            'estado de mexico': '15',
            michoacan: '16',
            'michoacan de ocampo': '16',
            morelos: '17',
            nayarit: '18',
            'nuevo leon': '19',
            oaxaca: '20',
            puebla: '21',
            queretaro: '22',
            'queretaro de arteaga': '22',
            'quintana roo': '23',
            'san luis potosi': '24',
            sinaloa: '25',
            sonora: '26',
            tabasco: '27',
            tamaulipas: '28',
            tlaxcala: '29',
            veracruz: '30',
            'veracruz de ignacio de la llave': '30',
            yucatan: '31',
            zacatecas: '32',
        };
    }
    async buscar(query, estado, municipio) {
        if (!query || query.trim().length < 2) {
            throw new common_1.BadRequestException('La búsqueda debe tener al menos 2 caracteres');
        }
        const termino = query.trim();
        const esCp = /^\d{4,5}$/.test(termino);
        const resultados = [];
        const vistos = new Set();
        if (!esCp) {
            const nominatim = await this.nominatim.buscar(termino, estado, municipio);
            for (const r of nominatim) {
                if (vistos.has(r.id))
                    continue;
                vistos.add(r.id);
                resultados.push(r);
                if (resultados.length >= 50)
                    return resultados.slice(0, 50);
            }
        }
        if (!esCp) {
            const asentamientos = await this.sepomex.buscar(termino, estado, municipio);
            const agebResultados = await this.buscarAgebPorAsentamientos(asentamientos, termino, vistos);
            for (const r of agebResultados) {
                if (vistos.has(r.id))
                    continue;
                vistos.add(r.id);
                resultados.push(r);
                if (resultados.length >= 50)
                    return resultados.slice(0, 50);
            }
        }
        if (esCp) {
            const asentamientos = await this.sepomex.buscarPorCp(termino);
            if (!asentamientos.length) {
                return this.buscarPorCpEnGeojson(termino, estado, municipio);
            }
            for (const a of asentamientos) {
                const estadoId = this.resolverEstadoId(a.estado);
                if (!estadoId)
                    continue;
                if (estado && !this.coincideEstado(a.estado, estado))
                    continue;
                if (municipio && !this.coincideTexto(a.municipio, municipio))
                    continue;
                const feature = await this.featurePorCp(estadoId, termino);
                if (!feature)
                    continue;
                const clave = `${estadoId}_${termino}`;
                if (vistos.has(clave))
                    continue;
                vistos.add(clave);
                resultados.push({
                    ...this.featureAResultado(feature, estadoId, a),
                    aproximado: true,
                    fuente: 'sepomex',
                });
            }
        }
        else {
            const asentamientos = await this.sepomex.buscar(termino, estado, municipio);
            const porEstado = {};
            for (const a of asentamientos) {
                const estadoId = this.resolverEstadoId(a.estado);
                if (!estadoId)
                    continue;
                if (estado && !this.coincideEstado(a.estado, estado))
                    continue;
                if (municipio && !this.coincideTexto(a.municipio, municipio))
                    continue;
                if (!porEstado[estadoId])
                    porEstado[estadoId] = [];
                porEstado[estadoId].push(a);
            }
            for (const estadoId of Object.keys(porEstado)) {
                try {
                    const geo = await this.descargarEstado(estadoId);
                    if (!geo?.features?.length)
                        continue;
                    for (const a of porEstado[estadoId]) {
                        const cp = a.codigo.padStart(5, '0');
                        const feature = geo.features.find((f) => String(f.properties?.d_codigo || f.properties?.cp || '').padStart(5, '0') === cp);
                        if (!feature)
                            continue;
                        const clave = `${estadoId}_${cp}_${this.normalizar(a.nombre)}`;
                        if (vistos.has(clave))
                            continue;
                        vistos.add(clave);
                        resultados.push({
                            ...this.featureAResultado(feature, estadoId, a),
                            aproximado: true,
                            fuente: 'sepomex',
                        });
                        if (resultados.length >= 50)
                            return resultados.slice(0, 50);
                    }
                }
                catch (err) {
                    this.logger.warn(`No se pudo cargar colonias para estado ${estadoId}: ${err.message}`);
                }
            }
        }
        return resultados.slice(0, 50);
    }
    async buscarAgebPorAsentamientos(asentamientos, termino, vistos) {
        const resultados = [];
        for (const a of asentamientos.slice(0, 15)) {
            const estadoId = this.resolverEstadoId(a.estado);
            if (!estadoId)
                continue;
            const featurePostal = await this.featurePorCp(estadoId, a.codigo);
            if (!featurePostal)
                continue;
            const punto = (0, geo_utils_1.centroide)(featurePostal.geometry);
            if (!punto)
                continue;
            const cveMun = await this.agebInegi.buscarClaveMunicipio(estadoId, a.municipio);
            if (!cveMun)
                continue;
            const agebs = await this.agebInegi.agebsCercanas(estadoId, cveMun, punto, 0.8, 3);
            if (!agebs.length)
                continue;
            const id = `inegi_ageb_${estadoId}_${cveMun}_${this.normalizar(a.nombre)}_${a.codigo}`;
            if (vistos.has(id))
                continue;
            vistos.add(id);
            const geometry = (0, geo_utils_1.unirGeometrias)(agebs.map((x) => x.geometry));
            if (!geometry)
                continue;
            resultados.push({
                id,
                nombre: `${a.nombre} (aprox. AGEB INEGI)`,
                tipo: a.tipo || 'Colonia',
                codigo_postal: a.codigo,
                municipio: a.municipio,
                estado: a.estado,
                estado_id: estadoId,
                direccion: `${a.nombre}, ${a.municipio}, ${a.estado}, CP ${a.codigo}`,
                geojson: geometry,
                fuente: 'inegi-ageb',
                aproximado: true,
            });
        }
        return resultados;
    }
    async obtenerPorId(estadoId, featureId) {
        const geo = await this.descargarEstado(estadoId);
        const partes = featureId.split('_');
        const cpId = (partes[2] || '').padStart(5, '0');
        const nombreId = partes.slice(3).join('_') || '';
        let feature = geo?.features?.find((f) => {
            const cpFeature = String(f.properties?.d_codigo || f.properties?.cp || '').padStart(5, '0');
            return cpFeature === cpId;
        });
        if (feature && nombreId) {
            const nombreNormalizado = this.normalizar(nombreId);
            const matchExacto = geo.features.find((f) => {
                const cpFeature = String(f.properties?.d_codigo || f.properties?.cp || '').padStart(5, '0');
                if (cpFeature !== cpId)
                    return false;
                const nombreFeature = this.normalizar(f.properties?.d_asenta || f.properties?.nombre || f.properties?.name || '');
                return nombreFeature === nombreNormalizado;
            });
            if (matchExacto)
                feature = matchExacto;
        }
        if (!feature)
            return null;
        const cp = String(feature.properties?.d_codigo || '');
        let asentamiento;
        if (cp) {
            const candidatos = await this.sepomex.buscarPorCp(cp);
            const nombreNormalizado = this.normalizar(nombreId);
            asentamiento =
                candidatos.find((a) => this.resolverEstadoId(a.estado) === estadoId &&
                    this.normalizar(a.nombre) === nombreNormalizado) ||
                    candidatos.find((a) => this.resolverEstadoId(a.estado) === estadoId) ||
                    candidatos[0];
        }
        return this.featureAResultado(feature, estadoId, asentamiento);
    }
    async descargarEstado(clave) {
        if (this.cache[clave]?.descargado) {
            return { features: this.cache[clave].features };
        }
        const url = `${this.baseUrl}/${clave}-Gto.geojson`;
        const urls = this.buildUrls(clave);
        for (const u of urls) {
            try {
                this.logger.debug(`Descargando colonias: ${u}`);
                const response = await (0, rxjs_1.lastValueFrom)(this.http.get(u, {
                    headers: { Accept: 'application/json' },
                    timeout: 60000,
                }));
                const data = response.data || {};
                const features = data.features || [];
                this.cache[clave] = {
                    descargado: true,
                    features,
                    municipios: new Set(features.map((f) => this.normalizar(f.properties?.d_mnpio || f.properties?.municipio || '')).filter(Boolean)),
                };
                this.logger.log(`Colonias cargadas para ${clave}: ${features.length} polígonos`);
                return data;
            }
            catch (err) {
                this.logger.warn(`Falló descarga de colonias ${u}: ${err?.message}`);
            }
        }
        throw new common_1.BadRequestException(`No se pudieron cargar colonias para el estado ${clave}`);
    }
    buildUrls(clave) {
        const nombres = {
            '01': '01-Ags',
            '02': '02-Bc',
            '03': '03-Bcs',
            '04': '04-Camp',
            '05': '05-Coah',
            '06': '06-Col',
            '07': '07-Chis',
            '08': '08-Chih',
            '09': '09-Cdmx',
            '10': '10-Dgo',
            '11': '11-Gto',
            '12': '12-Gro',
            '13': '13-Hgo',
            '14': '14-Jal',
            '15': '15-Mex',
            '16': '16-Mich',
            '17': '17-Mor',
            '18': '18-Nay',
            '19': '19-NL',
            '20': '20-Oax',
            '21': '21-Pue',
            '22': '22-Qro',
            '23': '23-Qroo',
            '24': '24-SLP',
            '25': '25-Sin',
            '26': '26-Son',
            '27': '27-Tab',
            '28': '28-Tmps',
            '29': '29-Tlax',
            '30': '30-Ver',
            '31': '31-Yuc',
            '32': '32-Zac',
        };
        const nombre = nombres[clave];
        if (!nombre)
            return [];
        return [`${this.baseUrl}/${nombre}.geojson`];
    }
    resolverEstadoId(nombre) {
        const n = this.normalizar(nombre);
        return this.ESTADO_CLAVE[n] || null;
    }
    featureAResultado(feature, estadoId, asentamiento) {
        const p = feature.properties || {};
        const cp = (asentamiento?.codigo || String(p.d_codigo || p.cp || p.codigo || '')).padStart(5, '0');
        const nombre = asentamiento?.nombre || p.d_asenta || p.nombre || p.name || 'Sin nombre';
        const municipio = asentamiento?.municipio || p.d_mnpio || p.municipio || p.mun || '';
        const tipo = asentamiento?.tipo || p.d_tipo_asenta || p.tipo || 'Colonia';
        const id = this.crearId(p, estadoId, asentamiento?.nombre);
        const nombreEstado = this.nombreEstado(estadoId);
        return {
            id,
            nombre,
            tipo,
            codigo_postal: cp,
            municipio,
            estado: nombreEstado,
            estado_id: estadoId,
            direccion: `${nombre}, ${municipio}, ${nombreEstado}, CP ${cp}`,
            geojson: feature.geometry,
            fuente: 'sepomex',
            aproximado: false,
        };
    }
    crearId(p, estadoId, nombreFallback) {
        const cp = String(p.d_codigo || p.cp || p.codigo || '00000').padStart(5, '0');
        const nombre = this.normalizar(nombreFallback || p.d_asenta || p.nombre || p.name || 'sin-nombre');
        return `sepomex_${estadoId}_${cp}_${nombre}`;
    }
    async obtenerPorIdNominatim(featureId) {
        const partes = featureId.split('_');
        if (partes.length < 3)
            return null;
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.http.get('https://nominatim.openstreetmap.org/lookup', {
                params: {
                    osm_ids: partes.slice(1).join('_').replace(/_/g, ''),
                    format: 'geojson',
                    polygon_geojson: 1,
                    addressdetails: 1,
                },
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'ESTRATO SaaS / contacto@estrato.mx',
                },
                timeout: 30000,
            }));
            const features = response.data?.features || [];
            if (!features.length)
                return null;
            const f = features[0];
            const props = f.properties || {};
            const address = props.address || {};
            return {
                id: featureId,
                nombre: props.namedetails?.name || props.display_name?.split(',')[0] || '',
                tipo: props.type || props.category || 'colonia',
                codigo_postal: address.postcode || '',
                municipio: address.county || address.city || address.town || address.municipality || '',
                estado: address.state || '',
                estado_id: this.resolverEstadoId(address.state || '') || '',
                direccion: props.display_name || '',
                geojson: f.geometry,
                fuente: 'nominatim',
                aproximado: false,
            };
        }
        catch (err) {
            this.logger.warn(`Nominatim lookup falló: ${err.message}`);
            return null;
        }
    }
    async obtenerPorIdAgeb(featureId) {
        const partes = featureId.split('_');
        if (partes.length < 6 || partes[0] !== 'inegi' || partes[1] !== 'ageb')
            return null;
        const estadoId = partes[2];
        const cveMun = partes[3];
        const cp = partes[partes.length - 1].padStart(5, '0');
        const nombre = partes.slice(4, partes.length - 1).join(' ');
        const estadoNombre = this.nombreEstado(estadoId);
        const featurePostal = await this.featurePorCp(estadoId, cp);
        if (!featurePostal)
            return null;
        const punto = (0, geo_utils_1.centroide)(featurePostal.geometry);
        if (!punto)
            return null;
        const agebs = await this.agebInegi.agebsCercanas(estadoId, cveMun, punto, 0.8, 3);
        if (!agebs.length)
            return null;
        const geometry = (0, geo_utils_1.unirGeometrias)(agebs.map((x) => x.geometry));
        if (!geometry)
            return null;
        return {
            id: featureId,
            nombre: `${nombre} (aprox. AGEB INEGI)`,
            tipo: 'Colonia',
            codigo_postal: cp,
            municipio: '',
            estado: estadoNombre,
            estado_id: estadoId,
            direccion: `${nombre}, ${estadoNombre}, CP ${cp}`,
            geojson: geometry,
            fuente: 'inegi-ageb',
            aproximado: true,
        };
    }
    async featurePorCp(estadoId, cp) {
        try {
            const geo = await this.descargarEstado(estadoId);
            if (!geo?.features?.length)
                return null;
            return (geo.features.find((f) => String(f.properties?.d_codigo || f.properties?.cp || '').padStart(5, '0') === cp.padStart(5, '0')) || null);
        }
        catch (err) {
            this.logger.warn(`No se pudo cargar estado ${estadoId} para CP ${cp}: ${err.message}`);
            return null;
        }
    }
    async buscarPorCpEnGeojson(cp, estado, municipio) {
        const resultados = [];
        const vistos = new Set();
        const claves = estado
            ? [this.resolverEstadoId(estado)].filter(Boolean)
            : [...new Set(Object.values(this.ESTADO_CLAVE))];
        for (const estadoId of claves) {
            const feature = await this.featurePorCp(estadoId, cp);
            if (!feature)
                continue;
            const clave = `${estadoId}_${cp}`;
            if (vistos.has(clave))
                continue;
            vistos.add(clave);
            if (municipio) {
                const nombreMun = this.normalizar(feature.properties?.d_mnpio || '');
                if (!this.coincideTexto(nombreMun, municipio))
                    continue;
            }
            resultados.push(this.featureAResultado(feature, estadoId));
        }
        return resultados.slice(0, 50);
    }
    coincideEstado(nombreEstado, filtro) {
        const estadoFiltro = this.resolverEstadoId(filtro);
        if (estadoFiltro) {
            return this.resolverEstadoId(nombreEstado) === estadoFiltro;
        }
        return this.coincideTexto(nombreEstado, filtro);
    }
    coincideTexto(texto, filtro) {
        const a = this.normalizar(texto);
        const b = this.normalizar(filtro);
        return a.includes(b) || b.includes(a);
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
    nombreEstado(clave) {
        const nombres = {
            '01': 'Aguascalientes',
            '02': 'Baja California',
            '03': 'Baja California Sur',
            '04': 'Campeche',
            '05': 'Coahuila',
            '06': 'Colima',
            '07': 'Chiapas',
            '08': 'Chihuahua',
            '09': 'Ciudad de México',
            '10': 'Durango',
            '11': 'Guanajuato',
            '12': 'Guerrero',
            '13': 'Hidalgo',
            '14': 'Jalisco',
            '15': 'México',
            '16': 'Michoacán',
            '17': 'Morelos',
            '18': 'Nayarit',
            '19': 'Nuevo León',
            '20': 'Oaxaca',
            '21': 'Puebla',
            '22': 'Querétaro',
            '23': 'Quintana Roo',
            '24': 'San Luis Potosí',
            '25': 'Sinaloa',
            '26': 'Sonora',
            '27': 'Tabasco',
            '28': 'Tamaulipas',
            '29': 'Tlaxcala',
            '30': 'Veracruz',
            '31': 'Yucatán',
            '32': 'Zacatecas',
        };
        return nombres[clave] || clave;
    }
};
exports.ColoniasService = ColoniasService;
exports.ColoniasService = ColoniasService = ColoniasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        sepomex_catalogo_service_1.SepomexCatalogoService,
        nominatim_service_1.ColoniasNominatimService,
        ageb_inegi_service_1.AgebInegiService])
], ColoniasService);
//# sourceMappingURL=colonias.service.js.map