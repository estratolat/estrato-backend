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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GisParserService = void 0;
const common_1 = require("@nestjs/common");
const xmldom_1 = require("@xmldom/xmldom");
const adm_zip_1 = __importDefault(require("adm-zip"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const shapefile = __importStar(require("shapefile"));
const proj4_1 = __importDefault(require("proj4"));
let toGeoJSON = null;
async function cargarToGeoJSON() {
    if (!toGeoJSON) {
        const mod = await Promise.resolve().then(() => __importStar(require('@tmcw/togeojson')));
        toGeoJSON = mod;
    }
    return toGeoJSON;
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
    async parse(archivo, tipoArchivo, shapefileHint) {
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
                return this.parseShapefile(buffer, shapefileHint);
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
    async parseShapefile(buffer, shapefileHint) {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'estrato-shapefile-'));
        try {
            const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
            let shpPath;
            let dbfPath;
            let prjString;
            if (isZip) {
                const extracted = this.extraerShapefileDeZipAPath(buffer, tmpDir, shapefileHint);
                shpPath = extracted.shpPath;
                dbfPath = extracted.dbfPath;
                prjString = extracted.prjString;
            }
            else {
                shpPath = path.join(tmpDir, 'archivo.shp');
                fs.writeFileSync(shpPath, buffer);
            }
            const source = await shapefile.open(shpPath, dbfPath, { encoding: 'utf-8' });
            const features = [];
            let row;
            while ((row = await source.read()) && !row.done) {
                features.push({
                    type: 'Feature',
                    geometry: row.value.geometry,
                    properties: row.value.properties || {},
                });
            }
            if (prjString) {
                const projDef = this.proyeccionDesdePrj(prjString);
                if (projDef) {
                    console.log('[parseShapefile] reproyectando de', projDef, 'a WGS84');
                    features.forEach((f) => {
                        if (f.geometry) {
                            f.geometry = this.reproyectarGeometria(f.geometry, projDef);
                        }
                    });
                }
            }
            console.log('[parseShapefile] features leídas:', features.length);
            return this.normalizarGeoJSON({ type: 'FeatureCollection', features });
        }
        catch (err) {
            console.error('[parseShapefile] Error parseando shapefile:', err?.message, err?.stack);
            throw new common_1.BadRequestException(`No se pudo procesar el Shapefile: ${err?.message || 'verifica que sea .zip con .shp, .dbf y .shx'}`);
        }
        finally {
            try {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
            catch {
            }
        }
    }
    extraerShapefileDeZipAPath(buffer, tmpDir, shapefileHint) {
        const zip = new adm_zip_1.default(buffer);
        const entries = zip.getEntries();
        const shpEntries = entries.filter((e) => e.entryName.toLowerCase().endsWith('.shp') && !e.entryName.includes('__MACOSX/'));
        if (shpEntries.length === 0) {
            throw new common_1.BadRequestException('El zip no contiene archivos .shp');
        }
        console.log('[extraerShapefileDeZipAPath] shapefiles encontrados:', shpEntries.map((e) => e.entryName));
        let shpEntry = shpEntries[0];
        if (shpEntries.length > 1) {
            const hint = (shapefileHint || '').toLowerCase().trim();
            const keywords = hint ? hint.split(/[,;\s]+/).filter(Boolean) : [];
            const seccionKeywords = ['seccion', 'secciones', 'secc', 'section'];
            const score = (entry) => {
                const name = entry.entryName.toLowerCase().replace(/\.shp$/, '');
                let s = 0;
                keywords.forEach((k) => { if (name.includes(k))
                    s += 10; });
                seccionKeywords.forEach((k) => { if (name.includes(k))
                    s += 5; });
                const aux = ['adoquin', 'aeropuerto', 'autopista', 'brecha', 'cementerio', 'edificio',
                    'escuela', 'hospital', 'iglesia', 'mercado', 'puente', 'rio', 'rios', 'vialidad',
                    'vereda', 'colonia', 'localidad', 'manzana', 'municipio', 'distrito', 'entidad'];
                aux.forEach((a) => { if (name.includes(a))
                    s -= 20; });
                return s;
            };
            const sorted = [...shpEntries].sort((a, b) => score(b) - score(a));
            shpEntry = sorted[0];
            console.log('[extraerShapefileDeZipAPath] elegido:', shpEntry.entryName, 'score:', score(shpEntry));
        }
        const entryBaseName = shpEntry.entryName.replace(/\.shp$/i, '');
        const baseName = path.basename(entryBaseName);
        const exts = ['.shp', '.shx', '.dbf', '.prj', '.cpg', '.sbn', '.sbx'];
        let dbfPath;
        let prjString;
        exts.forEach((ext) => {
            const entryName = `${entryBaseName}${ext}`;
            const entry = entries.find((e) => e.entryName.toLowerCase() === entryName.toLowerCase());
            if (entry) {
                const data = entry.getData();
                const outPath = path.join(tmpDir, `${baseName}${ext}`);
                fs.writeFileSync(outPath, data);
                if (ext === '.dbf')
                    dbfPath = outPath;
                if (ext === '.prj')
                    prjString = data.toString('utf-8');
            }
        });
        const shpPath = path.join(tmpDir, `${baseName}.shp`);
        if (!fs.existsSync(shpPath)) {
            throw new common_1.BadRequestException('No se pudo extraer el archivo .shp seleccionado');
        }
        return { shpPath, dbfPath, prjString };
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
    proyeccionDesdePrj(prjString) {
        const matches = [...prjString.matchAll(/AUTHORITY\["EPSG","(\d{4,5})"\]/g)];
        for (const match of matches) {
            const code = parseInt(match[1], 10);
            if (code >= 32601 && code <= 32660) {
                const zone = code - 32600;
                return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`;
            }
            if (code >= 32701 && code <= 32760) {
                const zone = code - 32700;
                return `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs`;
            }
        }
        if (prjString.includes('EPSG"4326"') || prjString.includes('WGS_1984')) {
            return undefined;
        }
        return undefined;
    }
    reproyectarGeometria(geometry, projDef) {
        if (!geometry || !geometry.coordinates)
            return geometry;
        return {
            ...geometry,
            coordinates: this.reproyectarNodo(geometry.coordinates, projDef),
        };
    }
    reproyectarNodo(node, projDef) {
        if (Array.isArray(node) && node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
            return (0, proj4_1.default)(projDef, proj4_1.default.WGS84, node);
        }
        if (Array.isArray(node)) {
            return node.map((child) => this.reproyectarNodo(child, projDef));
        }
        return node;
    }
};
exports.GisParserService = GisParserService;
exports.GisParserService = GisParserService = __decorate([
    (0, common_1.Injectable)()
], GisParserService);
//# sourceMappingURL=gis-parser.service.js.map