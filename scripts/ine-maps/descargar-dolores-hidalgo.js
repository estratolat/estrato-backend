#!/usr/bin/env node
/**
 * Descarga la cartografía electoral del INE (shapefiles nacionales)
 * y extrae únicamente el municipio de Dolores Hidalgo, Guanajuato.
 *
 * Salida: archivos GeoJSON listos para subir a ESTRATO en:
 *   scripts/ine-maps/salida/dolores-hidalgo/
 *
 * Capas generadas:
 *   - municipio.geojson        (límite municipal)
 *   - distritos_locales.geojson
 *   - distritos_federales.geojson
 *   - localidades.geojson        (comunidades/localidades)
 *   - secciones.geojson          (secciones electorales del municipio)
 *   - colonias.geojson           (solo si el INE publica capa de colonias)
 *
 * Uso:
 *   node scripts/ine-maps/descargar-dolores-hidalgo.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');
const shapefile = require('shapefile');
const turf = require('@turf/turf');
const reproject = require('reproject');
const proj4 = require('proj4');

const SALIDA = path.join(__dirname, 'salida', 'dolores-hidalgo');
const TEMP = path.join(__dirname, 'tmp');

const INE_BASE_URL = 'https://pautas.ine.mx/transparencia/mapas/cob_2024';

// Proyección del INE: North America Lambert Conformal Conic (basado en WGS84)
const INE_PROJ4 =
  '+proj=lcc +lat_1=17.5 +lat_2=29.5 +lat_0=12 +lon_0=-102 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs';

const CAPAS = [
  { archivo: 'MUNICIPIO.zip', salida: 'municipio.geojson', filtro: 'municipio' },
  { archivo: 'DISTRITO_LOCAL.zip', salida: 'distritos_locales.geojson', filtro: 'distrito_local' },
  { archivo: 'DISTRITO_FEDERAL.zip', salida: 'distritos_federales.geojson', filtro: 'distrito_federal' },
  { archivo: 'LOCALIDAD.zip', salida: 'localidades.geojson', filtro: 'localidad' },
  { archivo: 'SECCION.zip', salida: 'secciones.geojson', filtro: 'seccion' },
];

const CLAVE_ENTIDAD = '11';     // Guanajuato
const CLAVE_MUNICIPIO = '014';  // Dolores Hidalgo

function limpiarDirectorio(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function descargar(url, destino) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destino);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} descargando ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', reject);
  });
}

function extraerZip(zipPath, destino) {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destino, true);
  return fs.readdirSync(destino);
}

function encontrarShapefile(dir, hint) {
  const archivos = fs.readdirSync(dir, { recursive: true });
  const shps = archivos
    .map((a) => (typeof a === 'string' ? a : a.toString()))
    .filter((a) => a.toLowerCase().endsWith('.shp'))
    .map((a) => path.join(dir, a));

  if (shps.length === 0) return null;
  if (shps.length === 1) return shps[0];

  // Si hay varios, preferir el que coincida con el hint
  const lowerHint = hint.toLowerCase();
  const preferido = shps.find((s) =>
    path.basename(s, '.shp').toLowerCase().includes(lowerHint),
  );
  return preferido || shps[0];
}

function campoCoincide(props, nombres, valor) {
  for (const nombre of nombres) {
    const keys = Object.keys(props).filter(
      (k) => k.toUpperCase() === nombre.toUpperCase(),
    );
    for (const key of keys) {
      const v = String(props[key] ?? '').trim().padStart(valor.length, '0');
      if (v === valor) return true;
    }
  }
  return false;
}

async function shpToGeoJSON(shpPath) {
  const features = [];
  const source = await shapefile.open(shpPath);
  let result = await source.read();
  while (!result.done) {
    features.push(result.value);
    result = await source.read();
  }
  return {
    type: 'FeatureCollection',
    features,
  };
}

function reproyectarA4326(geojson) {
  return reproject.reproject(geojson, proj4(INE_PROJ4), proj4.WGS84);
}

let limiteMunicipalCache = null;

async function obtenerLimiteMunicipal() {
  if (limiteMunicipalCache) return limiteMunicipalCache;
  const municipioPath = path.join(SALIDA, 'municipio.geojson');
  if (!fs.existsSync(municipioPath)) {
    throw new Error('No se encontró el municipio.geojson. Procesa la capa MUNICIPIO primero.');
  }
  const raw = fs.readFileSync(municipioPath, 'utf8');
  const geojson = JSON.parse(raw);
  if (!geojson.features?.length) {
    throw new Error('municipio.geojson está vacío');
  }
  limiteMunicipalCache = geojson.features[0];
  return limiteMunicipalCache;
}

function filtrarPorMunicipio(geojson, tipo) {
  return {
    ...geojson,
    features: geojson.features.filter((f) => {
      const p = f.properties || {};

      // Si la capa es MUNICIPIO, filtrar por clave de municipio
      if (tipo === 'municipio') {
        return (
          campoCoincide(p, ['MUNICIPIO', 'MUN', 'CVE_MUN', 'CVE_MUNICIPIO'], CLAVE_MUNICIPIO) &&
          campoCoincide(p, ['ENTIDAD', 'ENT', 'CVE_ENT', 'CVE_ENTIDAD'], CLAVE_ENTIDAD)
        );
      }

      // Para el resto de capas, primero intentamos filtro por campos de municipio
      const tieneCamposMun =
        campoCoincide(p, ['MUNICIPIO', 'MUN', 'CVE_MUN', 'CVE_MUNICIPIO'], CLAVE_MUNICIPIO) &&
        campoCoincide(p, ['ENTIDAD', 'ENT', 'CVE_ENT', 'CVE_ENTIDAD'], CLAVE_ENTIDAD);

      if (tieneCamposMun) return true;

      // Fallback: clave geoestadística completa de 5 dígitos
      for (const key of Object.keys(p)) {
        const val = String(p[key] ?? '').trim();
        if (val === `${CLAVE_ENTIDAD}${CLAVE_MUNICIPIO}`) return true;
      }

      return false;
    }),
  };
}

async function recortarPorLimiteMunicipal(geojson) {
  const limite = await obtenerLimiteMunicipal();
  const limiteBbox = turf.bbox(limite); // [minX, minY, maxX, maxY]
  const features = [];
  let revisados = 0;
  let porBbox = 0;
  let intersecciones = 0;
  let errores = 0;

  for (const f of geojson.features) {
    revisados++;
    try {
      // Primero filtro rápido por bbox
      const fBbox = turf.bbox(f);
      if (
        fBbox[0] > limiteBbox[2] ||
        fBbox[2] < limiteBbox[0] ||
        fBbox[1] > limiteBbox[3] ||
        fBbox[3] < limiteBbox[1]
      ) {
        continue;
      }
      porBbox++;

      if (turf.booleanIntersects(f, limite)) {
        features.push(f);
        intersecciones++;
      }
    } catch (err) {
      errores++;
      // Fallback por si la geometría es inválida: centroide dentro del municipio
      try {
        const centroid = turf.centroid(f);
        if (turf.booleanPointInPolygon(centroid, limite)) {
          features.push(f);
          intersecciones++;
        }
      } catch {
        // ignorar
      }
    }
  }

  console.log(`      [recorte espacial] revisados: ${revisados}, pasan bbox: ${porBbox}, intersecciones: ${intersecciones}, errores: ${errores}`);
  return { type: 'FeatureCollection', features };
}

async function procesarCapa({ archivo, salida, filtro }, forzarRecorteEspacial = false) {
  const url = `${INE_BASE_URL}/${archivo}`;
  const zipPath = path.join(TEMP, archivo);
  const extractDir = path.join(TEMP, archivo.replace('.zip', ''));

  console.log(`\n📥 Descargando ${archivo}...`);
  await descargar(url, zipPath);

  console.log(`📦 Extrayendo ${archivo}...`);
  limpiarDirectorio(extractDir);
  extraerZip(zipPath, extractDir);

  const shpPath = encontrarShapefile(extractDir, filtro);
  if (!shpPath) {
    console.warn(`⚠️ No se encontró shapefile para ${archivo}`);
    return;
  }
  console.log(`🗺️  Procesando ${path.basename(shpPath)}...`);

  const geojson = await shpToGeoJSON(shpPath);
  console.log(`   Features totales: ${geojson.features.length}`);

  console.log('🌐 Reproyectando a WGS84 (EPSG:4326)...');
  const reproyectado = reproyectarA4326(geojson);

  let filtrado = filtrarPorMunicipio(reproyectado, filtro);
  console.log(`   Features por atributo: ${filtrado.features.length}`);

  // Para distritos (que no traen clave de municipio), recortar espacialmente
  if (forzarRecorteEspacial || filtrado.features.length === 0) {
    filtrado = await recortarPorLimiteMunicipal(reproyectado);
    console.log(`   Features por recorte espacial: ${filtrado.features.length}`);
  }

  const outPath = path.join(SALIDA, salida);
  fs.writeFileSync(outPath, JSON.stringify(filtrado, null, 2));
  console.log(`✅ Guardado: ${outPath}`);
}

async function main() {
  limpiarDirectorio(TEMP);
  limpiarDirectorio(SALIDA);

  console.log('🗺️  Descargando cartografía electoral del INE para Dolores Hidalgo, Guanajuato');
  console.log(`   Clave entidad: ${CLAVE_ENTIDAD}, Clave municipio: ${CLAVE_MUNICIPIO}`);

  // Procesar primero el municipio para usarlo como máscara espacial
  const capaMunicipio = CAPAS.find((c) => c.filtro === 'municipio');
  if (capaMunicipio) {
    await procesarCapa(capaMunicipio);
  }

  for (const capa of CAPAS) {
    if (capa.filtro === 'municipio') continue;
    try {
      // Distritos requieren recorte espacial forzado
      const forzar = ['distrito_local', 'distrito_federal'].includes(capa.filtro);
      await procesarCapa(capa, forzar);
    } catch (err) {
      console.error(`❌ Error procesando ${capa.archivo}:`, err.message);
    }
  }

  console.log('\n🏁 Proceso completado.');
  console.log(`📂 Archivos listos en: ${SALIDA}`);
  console.log('\nPróximo paso: súbelos a ESTRATO desde el Mapa Territorial.');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
