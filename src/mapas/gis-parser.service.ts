import { Injectable, BadRequestException } from '@nestjs/common';
import { DOMParser } from '@xmldom/xmldom';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as shapefile from 'shapefile';
import proj4 from 'proj4';

// toGeoJSON es ESM; lo cargamos con dynamic import
let toGeoJSON: any = null;

async function cargarToGeoJSON() {
  if (!toGeoJSON) {
    const mod = await import('@tmcw/togeojson');
    toGeoJSON = mod;
  }
  return toGeoJSON;
}

@Injectable()
export class GisParserService {
  detectarTipo(nombre: string): string {
    const lower = nombre.toLowerCase();
    if (lower.endsWith('.kml')) return 'kml';
    if (lower.endsWith('.geojson') || lower.endsWith('.json')) return 'geojson';
    if (lower.endsWith('.zip')) return 'shapefile';
    if (lower.endsWith('.gpx')) return 'gpx';
    return 'desconocido';
  }

  async parse(archivo: Express.Multer.File, tipoArchivo?: string, shapefileHint?: string): Promise<any> {
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
        throw new BadRequestException(`Tipo de archivo no soportado: ${tipo}`);
    }
  }

  private async parseKml(buffer: Buffer): Promise<any> {
    try {
      const texto = buffer.toString('utf-8');
      const parser = new DOMParser();
      const doc = parser.parseFromString(texto, 'text/xml');
      const tgj = await cargarToGeoJSON();
      const geojson = tgj.kml(doc);
      return this.normalizarGeoJSON(geojson);
    } catch (err) {
      console.error('Error parseando KML:', err);
      throw new BadRequestException('El archivo KML está corrupto o no es válido');
    }
  }

  private parseGeoJson(buffer: Buffer): any {
    try {
      const texto = buffer.toString('utf-8');
      const geojson = JSON.parse(texto);
      return this.normalizarGeoJSON(geojson);
    } catch (err) {
      throw new BadRequestException('El archivo GeoJSON no tiene formato JSON válido');
    }
  }

  private async parseShapefile(buffer: Buffer, shapefileHint?: string): Promise<any> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'estrato-shapefile-'));
    try {
      const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
      let shpPath: string;
      let dbfPath: string | undefined;

      let prjString: string | undefined;
      if (isZip) {
        // Extraer el shapefile más relevante del zip
        const extracted = this.extraerShapefileDeZipAPath(buffer, tmpDir, shapefileHint);
        shpPath = extracted.shpPath;
        dbfPath = extracted.dbfPath;
        prjString = extracted.prjString;
      } else {
        // Buffer .shp suelto
        shpPath = path.join(tmpDir, 'archivo.shp');
        fs.writeFileSync(shpPath, buffer);
      }

      const source = await shapefile.open(shpPath, dbfPath, { encoding: 'utf-8' });
      const features: any[] = [];
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
    } catch (err) {
      console.error('[parseShapefile] Error parseando shapefile:', (err as any)?.message, (err as any)?.stack);
      throw new BadRequestException(`No se pudo procesar el Shapefile: ${(err as any)?.message || 'verifica que sea .zip con .shp, .dbf y .shx'}`);
    } finally {
      // Limpieza best-effort del directorio temporal
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // Ignorar errores de limpieza
      }
    }
  }

  private extraerShapefileDeZipAPath(
    buffer: Buffer,
    tmpDir: string,
    shapefileHint?: string,
  ): { shpPath: string; dbfPath?: string; prjString?: string } {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const shpEntries = entries.filter(
      (e: any) => e.entryName.toLowerCase().endsWith('.shp') && !e.entryName.includes('__MACOSX/'),
    );
    if (shpEntries.length === 0) {
      throw new BadRequestException('El zip no contiene archivos .shp');
    }

    console.log('[extraerShapefileDeZipAPath] shapefiles encontrados:', shpEntries.map((e: any) => e.entryName));

    let shpEntry = shpEntries[0];
    if (shpEntries.length > 1) {
      const hint = (shapefileHint || '').toLowerCase().trim();
      const keywords = hint ? hint.split(/[,;\s]+/).filter(Boolean) : [];
      const seccionKeywords = ['seccion', 'secciones', 'secc', 'section'];

      const score = (entry: any): number => {
        const name = entry.entryName.toLowerCase().replace(/\.shp$/, '');
        let s = 0;
        keywords.forEach((k) => { if (name.includes(k)) s += 10; });
        seccionKeywords.forEach((k) => { if (name.includes(k)) s += 5; });
        const aux = ['adoquin', 'aeropuerto', 'autopista', 'brecha', 'cementerio', 'edificio',
          'escuela', 'hospital', 'iglesia', 'mercado', 'puente', 'rio', 'rios', 'vialidad',
          'vereda', 'colonia', 'localidad', 'manzana', 'municipio', 'distrito', 'entidad'];
        aux.forEach((a) => { if (name.includes(a)) s -= 20; });
        return s;
      };

      const sorted = [...shpEntries].sort((a: any, b: any) => score(b) - score(a));
      shpEntry = sorted[0];
      console.log('[extraerShapefileDeZipAPath] elegido:', shpEntry.entryName, 'score:', score(shpEntry));
    }

    const entryBaseName = shpEntry.entryName.replace(/\.shp$/i, '');
    const baseName = path.basename(entryBaseName);
    const exts = ['.shp', '.shx', '.dbf', '.prj', '.cpg', '.sbn', '.sbx'];
    let dbfPath: string | undefined;
    let prjString: string | undefined;

    exts.forEach((ext) => {
      const entryName = `${entryBaseName}${ext}`;
      const entry = entries.find((e: any) => e.entryName.toLowerCase() === entryName.toLowerCase());
      if (entry) {
        const data = entry.getData();
        const outPath = path.join(tmpDir, `${baseName}${ext}`);
        fs.writeFileSync(outPath, data);
        if (ext === '.dbf') dbfPath = outPath;
        if (ext === '.prj') prjString = data.toString('utf-8');
      }
    });

    const shpPath = path.join(tmpDir, `${baseName}.shp`);
    if (!fs.existsSync(shpPath)) {
      throw new BadRequestException('No se pudo extraer el archivo .shp seleccionado');
    }

    return { shpPath, dbfPath, prjString };
  }

  private async parseGpx(buffer: Buffer): Promise<any> {
    try {
      const texto = buffer.toString('utf-8');
      const parser = new DOMParser();
      const doc = parser.parseFromString(texto, 'text/xml');
      const tgj = await cargarToGeoJSON();
      const geojson = tgj.gpx(doc);
      return this.normalizarGeoJSON(geojson);
    } catch (err) {
      throw new BadRequestException('El archivo GPX no es válido');
    }
  }

  private normalizarGeoJSON(geojson: any): any {
    if (!geojson) {
      throw new BadRequestException('No se pudo generar GeoJSON del archivo');
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

  private limpiarFeatures(geojson: any): any {
    return {
      type: 'FeatureCollection',
      features: (geojson.features || []).map((f: any) => this.limpiarFeature(f)),
    };
  }

  private limpiarFeature(feature: any): any {
    return {
      type: 'Feature',
      geometry: feature.geometry,
      properties: feature.properties || {},
    };
  }

  private proyeccionDesdePrj(prjString: string): string | undefined {
    // Buscar códigos EPSG de proyección UTM (326xx norte, 327xx sur)
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
    // WGS 84 explícito
    if (prjString.includes('EPSG"4326"') || prjString.includes('WGS_1984')) {
      return undefined;
    }
    return undefined;
  }

  private reproyectarGeometria(geometry: any, projDef: string): any {
    if (!geometry || !geometry.coordinates) return geometry;
    return {
      ...geometry,
      coordinates: this.reproyectarNodo(geometry.coordinates, projDef),
    };
  }

  private reproyectarNodo(node: any, projDef: string): any {
    if (Array.isArray(node) && node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
      // proj4(source, dest, point) devuelve [lng, lat] cuando dest es WGS84
      return proj4(projDef, proj4.WGS84, node);
    }
    if (Array.isArray(node)) {
      return node.map((child) => this.reproyectarNodo(child, projDef));
    }
    return node;
  }
}
