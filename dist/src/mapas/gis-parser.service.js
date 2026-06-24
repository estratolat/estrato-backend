"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GisParserService = void 0;
const common_1 = require("@nestjs/common");
const xmldom_1 = require("@xmldom/xmldom");
const AdmZip = __importStar(require("adm-zip"));
let toGeoJSON = null;
let shpjs = null;
async function cargarToGeoJSON() {
    if (!toGeoJSON) {
        const mod = await Promise.resolve().then(() => __importStar(require('@tmcw/togeojson')));
        toGeoJSON = mod;
    }
    return toGeoJSON;
}
async function cargarShpjs() {
    if (!shpjs) {
        const mod = await Promise.resolve().then(() => __importStar(require('shpjs')));
        shpjs = mod.default || mod;
    }
    return shpjs;
}
let GisParserService = class GisParserService {
    detectarTipo(nombre) {
        const lower = nombre.toLowerCase();
        if (lower.endsWith('.kml'))
            return 'kml';
        if (lower.endsWith('.geojson') || lower.endsWith('.json'))
            return 'geojson';
        if (lower.endsWith('.zip'))
            return 'shapefile';
        if (lower.endsWith('.gpx'))
            return 'gpx';
        return 'desconocido';
    }
    async parse(archivo, tipoArchivo) {
        const buffer = archivo.buffer;
        const originalName = archivo.originalname.toLowerCase();
        const tipo = tipoArchivo || this.detectarTipo(originalName);
        switch (tipo) {
            case 'kml':
                return this.parseKml(buffer);
            case 'geojson':
            case 'json':
                return this.parseGeoJson(buffer);
            case 'shapefile':
            case 'shp':
                return this.parseShapefile(buffer);
            case 'gpx':
                return this.parseGpx(buffer);
            default:
                throw new common_1.BadRequestException(`Tipo de archivo no soportado: ${tipo}`);
        }
    }
    async parseKml(buffer) {
        try {
            const texto = buffer.toString('utf-8');
            const parser = new xmldom_1.DOMParser();
            const doc = parser.parseFromString(texto, 'text/xml');
            const tgj = await cargarToGeoJSON();
            const geojson = tgj.kml(doc);
            return this.normalizarGeoJSON(geojson);
        }
        catch (err) {
            console.error('Error parseando KML:', err);
            throw new common_1.BadRequestException('El archivo KML está corrupto o no es válido');
        }
    }
    parseGeoJson(buffer) {
        try {
            const texto = buffer.toString('utf-8');
            const geojson = JSON.parse(texto);
            return this.normalizarGeoJSON(geojson);
        }
        catch (err) {
            throw new common_1.BadRequestException('El archivo GeoJSON no tiene formato JSON válido');
        }
    }
    async parseShapefile(buffer) {
        let shp;
        try {
            shp = await cargarShpjs();
            console.log('[parseShapefile] intentando parsear buffer directo, size:', buffer.length);
            const geojson = await shp(buffer);
            console.log('[parseShapefile] parse directo ok, features:', geojson?.features?.length);
            return this.normalizarGeoJSON(geojson);
        }
        catch (err) {
            console.error('[parseShapefile] Error parseando shapefile directo:', err?.message, err?.stack);
            try {
                console.log('[parseShapefile] fallback: extrayendo .shp del zip');
                const zip = new AdmZip(buffer);
                const entries = zip.getEntries();
                console.log('[parseShapefile] entries:', entries.map((e) => e.entryName));
                const shpEntry = entries.find((e) => e.entryName.toLowerCase().endsWith('.shp'));
                if (!shpEntry) {
                    throw new common_1.BadRequestException('El zip no contiene un archivo .shp');
                }
                if (!shp)
                    shp = await cargarShpjs();
                const shpBuffer = shpEntry.getData();
                console.log('[parseShapefile] .shp extraído, size:', shpBuffer.length);
                const geojson = await shp(shpBuffer);
                console.log('[parseShapefile] parse desde zip ok, features:', geojson?.features?.length);
                return this.normalizarGeoJSON(geojson);
            }
            catch (err2) {
                console.error('[parseShapefile] Error parseando shapefile desde zip:', err2?.message, err2?.stack);
                throw new common_1.BadRequestException(`No se pudo procesar el Shapefile: ${err2?.message || 'verifica que sea .zip con .shp, .dbf y .shx'}`);
            }
        }
    }
    async parseGpx(buffer) {
        try {
            const texto = buffer.toString('utf-8');
            const parser = new xmldom_1.DOMParser();
            const doc = parser.parseFromString(texto, 'text/xml');
            const tgj = await cargarToGeoJSON();
            const geojson = tgj.gpx(doc);
            return this.normalizarGeoJSON(geojson);
        }
        catch (err) {
            throw new common_1.BadRequestException('El archivo GPX no es válido');
        }
    }
    normalizarGeoJSON(geojson) {
        if (!geojson) {
            throw new common_1.BadRequestException('No se pudo generar GeoJSON del archivo');
        }
        if (geojson.type === 'FeatureCollection') {
            return this.limpiarFeatures(geojson);
        }
        if (geojson.type === 'Feature') {
            return { type: 'FeatureCollection', features: [this.limpiarFeature(geojson)] };
        }
        return {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: geojson, properties: {} }],
        };
    }
    limpiarFeatures(geojson) {
        return {
            type: 'FeatureCollection',
            features: (geojson.features || []).map((f) => this.limpiarFeature(f)),
        };
    }
    limpiarFeature(feature) {
        return {
            type: 'Feature',
            geometry: feature.geometry,
            properties: feature.properties || {},
        };
    }
};
exports.GisParserService = GisParserService;
exports.GisParserService = GisParserService = __decorate([
    (0, common_1.Injectable)()
], GisParserService);
//# sourceMappingURL=gis-parser.service.js.map