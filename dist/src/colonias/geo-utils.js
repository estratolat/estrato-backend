"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.centroide = centroide;
exports.distanciaKm = distanciaKm;
exports.unirGeometrias = unirGeometrias;
function centroide(geometry) {
    if (!geometry)
        return null;
    let coords = [];
    if (geometry.type === 'Point') {
        return geometry.coordinates;
    }
    if (geometry.type === 'Polygon') {
        coords = extraerAnillos(geometry.coordinates);
    }
    else if (geometry.type === 'MultiPolygon') {
        for (const poly of geometry.coordinates || []) {
            coords.push(...extraerAnillos(poly));
        }
    }
    else if (geometry.type === 'LineString') {
        coords = geometry.coordinates;
    }
    else if (geometry.type === 'MultiLineString') {
        for (const line of geometry.coordinates || []) {
            coords.push(...line);
        }
    }
    if (!coords.length)
        return null;
    let x = 0;
    let y = 0;
    let n = 0;
    for (const [lon, lat] of coords) {
        x += lon;
        y += lat;
        n++;
    }
    return [x / n, y / n];
}
function extraerAnillos(rings) {
    const puntos = [];
    for (const ring of rings || []) {
        for (const p of ring || []) {
            puntos.push(p);
        }
    }
    return puntos;
}
function distanciaKm(p1, p2) {
    const R = 6371;
    const dLat = deg2rad(p2[1] - p1[1]);
    const dLon = deg2rad(p2[0] - p1[0]);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(p1[1])) * Math.cos(deg2rad(p2[1])) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
function unirGeometrias(geometries) {
    if (!geometries.length)
        return null;
    if (geometries.length === 1)
        return geometries[0];
    const poligonos = [];
    for (const g of geometries) {
        if (g.type === 'Polygon')
            poligonos.push(g.coordinates);
        else if (g.type === 'MultiPolygon')
            poligonos.push(...g.coordinates);
    }
    if (poligonos.length === 0)
        return null;
    if (poligonos.length === 1) {
        return { type: 'Polygon', coordinates: poligonos[0] };
    }
    return { type: 'MultiPolygon', coordinates: poligonos };
}
//# sourceMappingURL=geo-utils.js.map