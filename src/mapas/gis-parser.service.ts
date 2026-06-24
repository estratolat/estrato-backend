import { Injectable, BadRequestException } from '@nestjs/common';
import { DOMParser } from '@xmldom/xmldom';
import * as AdmZip from 'adm-zip';

// Estas librerías son ESM; las cargamos con dynamic import para evitar ERR_REQUIRE_ESM
let toGeoJSON: any = null;
let shpjs: any = null;

async function cargarToGeoJSON() {
  if (!toGeoJSON) {
    const mod = await import('@tmcw/togeojson');
    toGeoJSON = mod;
  }
  return toGeoJSON;
}

async function cargarShpjs() {
  if (!shpjs) {
    const mod = await import('shpjs');
    shpjs = mod.default || mod;
  }
  return shpjs;
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

  async parse(archivo: Express.Multer.File, tipoArchivo?: string): Promise<any> {
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

  private async parseShapefile(buffer: Buffer): Promise<any> {
    let shp: any;
    try {
      shp = await cargarShpjs();
      console.log('[parseShapefile] intentando parsear buffer directo, size:', buffer.length);
      const geojson = await shp(buffer);
      console.log('[parseShapefile] parse directo ok, features:', geojson?.features?.length);
      return this.normalizarGeoJSON(geojson);
    } catch (err) {
      console.error('[parseShapefile] Error parseando shapefile directo:', (err as any)?.message, (err as any)?.stack);

      // Fallback: extraer .shp del zip
      try {
        console.log('[parseShapefile] fallback: extrayendo .shp del zip');
        const zip = new (AdmZip as any)(buffer);
        const entries = zip.getEntries();
        console.log('[parseShapefile] entries:', entries.map((e: any) => e.entryName));
        const shpEntry = entries.find((e: any) => e.entryName.toLowerCase().endsWith('.shp'));
        if (!shpEntry) {
          throw new BadRequestException('El zip no contiene un archivo .shp');
        }
        if (!shp) shp = await cargarShpjs();
        const shpBuffer = shpEntry.getData();
        console.log('[parseShapefile] .shp extraído, size:', shpBuffer.length);
        const geojson = await shp(shpBuffer);
        console.log('[parseShapefile] parse desde zip ok, features:', geojson?.features?.length);
        return this.normalizarGeoJSON(geojson);
      } catch (err2) {
        console.error('[parseShapefile] Error parseando shapefile desde zip:', (err2 as any)?.message, (err2 as any)?.stack);
        throw new BadRequestException(`No se pudo procesar el Shapefile: ${(err2 as any)?.message || 'verifica que sea .zip con .shp, .dbf y .shx'}`);
      }
    }
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
}
