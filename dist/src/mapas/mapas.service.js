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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const TIPOS_CAPA = ['territorio', 'apoyos', 'lideres', 'votantes', 'secciones_ine', 'eventos', 'recorridos', 'custom', 'inegi'];
const ORIGENES_CAPA = ['propia', 'externa', 'neutral'];
const CAPAS_PREDEFINIDAS = [
    { id: 'zonas', tipo: 'territorio', nombre: 'Zonas de trabajo', origen: 'propia', color: '#3B82F6', visible: true, orden: 1 },
    { id: 'secciones_ine', tipo: 'secciones_ine', nombre: 'Secciones INE', origen: 'neutral', color: '#9CA3AF', visible: false, orden: 2 },
    { id: 'lideres', tipo: 'lideres', nombre: 'Líderes territoriales', origen: 'propia', color: '#10B981', visible: true, orden: 3 },
    { id: 'votantes', tipo: 'votantes', nombre: 'Votantes / simpatizantes', origen: 'propia', color: '#8B5CF6', visible: false, orden: 4 },
    { id: 'apoyos', tipo: 'apoyos', nombre: 'Apoyos entregados', origen: 'propia', color: '#F59E0B', visible: true, orden: 5 },
    { id: 'peticiones', tipo: 'peticiones', nombre: 'Peticiones ciudadanas', origen: 'propia', color: '#06B6D4', visible: true, orden: 6 },
    { id: 'eventos', tipo: 'eventos', nombre: 'Eventos / mítines', origen: 'propia', color: '#EF4444', visible: true, orden: 7 },
    { id: 'recorridos', tipo: 'recorridos', nombre: 'Recorridos de brigada', origen: 'propia', color: '#06B6D4', visible: false, orden: 8 },
];
let MapasService = class MapasService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllCapas(tenantId) {
        const personalizadas = await this.prisma.capaMapa.findMany({
            where: { tenant_id: tenantId },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
            include: { creador: { select: { id: true, nombre: true } } },
        });
        return {
            predefinidas: CAPAS_PREDEFINIDAS,
            personalizadas,
        };
    }
    async findOneCapa(id, tenantId) {
        const capa = await this.prisma.capaMapa.findFirst({
            where: { id, tenant_id: tenantId },
            include: { creador: { select: { id: true, nombre: true } } },
        });
        if (!capa)
            throw new common_1.NotFoundException('Capa no encontrada');
        return capa;
    }
    async createCapa(data, tenantId, userId) {
        const payload = this.normalizarCapa(data, tenantId, userId);
        try {
            return await this.prisma.capaMapa.create({
                data: payload,
                include: { creador: { select: { id: true, nombre: true } } },
            });
        }
        catch (err) {
            console.error('[MapasService.createCapa] ERROR:', err?.message, err?.code);
            throw err;
        }
    }
    async updateCapa(id, data, tenantId) {
        await this.findOneCapa(id, tenantId);
        const payload = this.normalizarCapa(data, tenantId, undefined, true);
        return this.prisma.capaMapa.update({
            where: { id },
            data: payload,
            include: { creador: { select: { id: true, nombre: true } } },
        });
    }
    async removeCapa(id, tenantId) {
        await this.findOneCapa(id, tenantId);
        return this.prisma.capaMapa.delete({ where: { id } });
    }
    async findAllSeccionesINE(tenantId, estadoId, municipioId) {
        const where = { tenant_id: tenantId };
        if (estadoId != null)
            where.estado_id = estadoId;
        if (municipioId != null)
            where.municipio_id = municipioId;
        return this.prisma.seccionINE.findMany({
            where,
            orderBy: [{ municipio: 'asc' }, { seccion: 'asc' }],
        });
    }
    async importarSeccionesINE(tenantId, userId, geojson, metadata) {
        if (!geojson || !Array.isArray(geojson.features)) {
            throw new common_1.BadRequestException('El archivo no contiene un GeoJSON FeatureCollection válido');
        }
        const features = geojson.features.filter((f) => f?.geometry);
        if (features.length === 0) {
            throw new common_1.BadRequestException('No se encontraron geometrías válidas en el archivo');
        }
        const secciones = [];
        const collectionFeatures = [];
        for (const feature of features) {
            const props = feature.properties || {};
            const seccion = this.extraerCampo(props, ['seccion', 'SECCION', 'SECC', 'secc', 'sección', 'Seccion']);
            if (!seccion)
                continue;
            const estado = metadata.estado || this.extraerCampo(props, ['estado', 'ESTADO', 'NOM_ENT', 'nom_ent', 'entidad']);
            const municipio = metadata.municipio || this.extraerCampo(props, ['municipio', 'MUNICIPIO', 'NOM_MUN', 'nom_mun', 'municip']);
            const distritoFederal = this.parsearEntero(this.extraerCampo(props, ['distrito_federal', 'DISTRITO_F', 'DF', 'distrito_f', 'distritof']));
            const distritoLocal = this.parsearEntero(this.extraerCampo(props, ['distrito_local', 'DISTRITO_L', 'DL', 'distrito_l', 'distritol']));
            const padron = this.parsearEntero(this.extraerCampo(props, ['padron_2024', 'PADRON', 'padron', 'PADRON_2024']));
            const listaNominal = this.parsearEntero(this.extraerCampo(props, ['lista_nominal_2024', 'LISTA_N', 'LISTA_NOMINAL', 'lista_n', 'lista_nominal']));
            const geom = this.normalizarAMultiPolygon(feature.geometry);
            secciones.push({
                tenant_id: tenantId,
                seccion: String(seccion).padStart(4, '0').slice(0, 4),
                estado,
                estado_id: metadata.estado_id,
                municipio,
                municipio_id: metadata.municipio_id,
                distrito_federal: distritoFederal,
                distrito_local: distritoLocal,
                padron_2024: padron,
                lista_nominal_2024: listaNominal,
                coordenadas: geom,
            });
            collectionFeatures.push({
                type: 'Feature',
                geometry: geom,
                properties: {
                    ...props,
                    seccion: String(seccion).padStart(4, '0').slice(0, 4),
                    estado,
                    municipio,
                    estado_id: metadata.estado_id,
                    municipio_id: metadata.municipio_id,
                    distrito_federal: distritoFederal,
                    distrito_local: distritoLocal,
                    padron_2024: padron,
                    lista_nominal_2024: listaNominal,
                },
            });
        }
        if (secciones.length === 0) {
            throw new common_1.BadRequestException('No se pudieron identificar secciones electorales en el archivo. Verifica que las propiedades incluyan un campo de sección.');
        }
        for (const s of secciones) {
            const existing = await this.prisma.seccionINE.findUnique({
                where: {
                    tenant_id_estado_id_municipio_id_seccion: {
                        tenant_id: s.tenant_id,
                        estado_id: s.estado_id,
                        municipio_id: s.municipio_id,
                        seccion: s.seccion,
                    },
                },
            });
            if (existing) {
                await this.prisma.seccionINE.update({
                    where: { id: existing.id },
                    data: {
                        estado: s.estado,
                        municipio: s.municipio,
                        distrito_federal: s.distrito_federal,
                        distrito_local: s.distrito_local,
                        padron_2024: s.padron_2024,
                        lista_nominal_2024: s.lista_nominal_2024,
                        coordenadas: s.coordenadas,
                    },
                });
            }
            else {
                await this.prisma.seccionINE.create({ data: s });
            }
        }
        const capa = await this.createCapa({
            nombre: metadata.nombre || `Secciones INE ${metadata.municipio}`,
            tipo: 'secciones_ine',
            origen: 'externa',
            color: metadata.color || '#9CA3AF',
            visible: true,
            geojson: { type: 'FeatureCollection', features: collectionFeatures },
            metadata: {
                estado_id: metadata.estado_id,
                estado: metadata.estado,
                municipio_id: metadata.municipio_id,
                municipio: metadata.municipio,
                anio: metadata.anio || 2024,
                total_secciones: collectionFeatures.length,
                tipo_archivo: 'ine_secciones',
            },
        }, tenantId, userId);
        return { capa, total_secciones: collectionFeatures.length };
    }
    extraerCampo(props, candidatos) {
        for (const key of candidatos) {
            if (props[key] != null && String(props[key]).trim() !== '') {
                return String(props[key]).trim();
            }
        }
        return undefined;
    }
    normalizarAMultiPolygon(geometry) {
        if (!geometry || !geometry.type)
            return geometry;
        if (geometry.type === 'MultiPolygon')
            return geometry;
        if (geometry.type === 'Polygon') {
            return { type: 'MultiPolygon', coordinates: [geometry.coordinates] };
        }
        return geometry;
    }
    normalizarCapa(data, tenantId, userId, esUpdate = false) {
        const payload = {};
        if (!esUpdate) {
            payload.tenant_id = tenantId;
            if (userId)
                payload.created_by = userId;
        }
        if (data.nombre !== undefined)
            payload.nombre = String(data.nombre).trim();
        if (data.tipo !== undefined) {
            const tipo = String(data.tipo).trim().toLowerCase();
            if (!TIPOS_CAPA.includes(tipo)) {
                throw new common_1.BadRequestException(`Tipo de capa inválido: ${tipo}`);
            }
            payload.tipo = tipo;
        }
        if (data.origen !== undefined) {
            const origen = String(data.origen).trim().toLowerCase();
            if (!ORIGENES_CAPA.includes(origen)) {
                throw new common_1.BadRequestException(`Origen de capa inválido: ${origen}`);
            }
            payload.origen = origen;
        }
        if (data.color !== undefined)
            payload.color = String(data.color).trim();
        if (data.visible !== undefined)
            payload.visible = Boolean(data.visible);
        if (data.orden !== undefined)
            payload.orden = this.parsearEntero(data.orden, 0);
        if (data.geojson !== undefined) {
            if (data.geojson === null) {
                payload.geojson = null;
            }
            else {
                this.validarGeoJson(data.geojson);
                payload.geojson = data.geojson;
            }
        }
        if (data.metadata !== undefined) {
            payload.metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
        }
        return payload;
    }
    validarGeoJson(geojson) {
        if (!geojson || typeof geojson !== 'object') {
            throw new common_1.BadRequestException('geojson debe ser un objeto');
        }
        const validTypes = ['FeatureCollection', 'Feature', 'Polygon', 'MultiPolygon', 'Point', 'MultiPoint', 'LineString', 'MultiLineString'];
        if (!validTypes.includes(geojson.type)) {
            throw new common_1.BadRequestException(`Tipo de GeoJSON no soportado: ${geojson.type}`);
        }
        if (geojson.type === 'FeatureCollection' && !Array.isArray(geojson.features)) {
            throw new common_1.BadRequestException('FeatureCollection requiere un array features');
        }
    }
    parsearEntero(value, defaultValue = 0) {
        if (value === null || value === undefined || value === '')
            return defaultValue;
        const n = Number(value);
        return Number.isFinite(n) && Number.isInteger(n) ? n : defaultValue;
    }
    puntoDesde(coordenadas) {
        const c = coordenadas;
        if (!c || typeof c.lng !== 'number' || typeof c.lat !== 'number')
            return null;
        return [c.lng, c.lat];
    }
    async geojson(tenantId, capasSolicitadas, query) {
        const capasDisponibles = new Set([...CAPAS_PREDEFINIDAS.map(c => c.id), ...CAPAS_PREDEFINIDAS.map(c => c.tipo)]);
        const personalizadas = await this.prisma.capaMapa.findMany({
            where: { tenant_id: tenantId, visible: true },
            select: { id: true, tipo: true },
        });
        personalizadas.forEach(c => capasDisponibles.add(c.id));
        const capas = capasSolicitadas.length
            ? capasSolicitadas.filter(c => capasDisponibles.has(c))
            : CAPAS_PREDEFINIDAS.map(c => c.id);
        const resultado = {};
        for (const capa of capas) {
            switch (capa) {
                case 'zonas':
                case 'territorio':
                    resultado.zonas = await this.geojsonZonas(tenantId);
                    break;
                case 'secciones_ine':
                    resultado.secciones_ine = await this.geojsonSeccionesINE(tenantId);
                    break;
                case 'lideres':
                    resultado.lideres = await this.geojsonLideres(tenantId);
                    break;
                case 'votantes':
                    resultado.votantes = await this.geojsonVotantes(tenantId, query);
                    break;
                case 'apoyos':
                    resultado.apoyos = await this.geojsonApoyos(tenantId, query);
                    break;
                case 'peticiones':
                    resultado.peticiones = await this.geojsonPeticiones(tenantId, query);
                    break;
                case 'eventos':
                    resultado.eventos = await this.geojsonEventos(tenantId);
                    break;
                case 'recorridos':
                    resultado.recorridos = await this.geojsonRecorridos(tenantId);
                    break;
                default:
                    const custom = await this.geojsonCapaPersonalizada(tenantId, capa);
                    if (custom)
                        resultado[capa] = custom;
            }
        }
        return resultado;
    }
    async geojsonZonas(tenantId) {
        const zonas = await this.prisma.zona.findMany({
            where: { tenant_id: tenantId },
            include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
        });
        const stats = await this.estadisticasPorZona(tenantId);
        const features = zonas
            .filter(z => z.coordenadas)
            .map(z => {
            const st = stats.find(s => s.zona_id === z.id) || {};
            return {
                type: 'Feature',
                geometry: z.coordenadas,
                properties: {
                    id: z.id,
                    nombre: z.nombre,
                    tipo: z.tipo,
                    color: z.color,
                    secciones: z.secciones || [],
                    lider_id: z.lider_id,
                    lider_nombre: z.lider?.votante?.nombre || null,
                    meta_votos: z.meta_votos,
                    votos_estimados: z.votos_estimados,
                    descripcion: z.descripcion,
                    activa: z.activa,
                    votantes_count: st.votantes || 0,
                    apoyos_count: st.apoyos || 0,
                    lideres_count: st.lideres || 0,
                    eventos_count: st.eventos || 0,
                },
            };
        });
        return { type: 'FeatureCollection', features };
    }
    async geojsonSeccionesINE(tenantId, query = {}) {
        const baseWhere = { tenant_id: tenantId };
        if (query.todo === 'true') {
            const secciones = await this.prisma.seccionINE.findMany({
                where: { ...baseWhere, municipio_id: 20 },
            });
            return this.formatearSecciones(secciones);
        }
        const set = new Set();
        const [seccionesZonas, seccionesVotantes] = await Promise.all([
            this.prisma.zona.findMany({ where: { tenant_id: tenantId }, select: { secciones: true } }),
            this.prisma.votante.findMany({ where: { tenant_id: tenantId, seccion_electoral: { not: null } }, select: { seccion_electoral: true } }),
        ]);
        seccionesZonas.forEach(z => z.secciones?.forEach(s => set.add(s)));
        seccionesVotantes.forEach(v => v.seccion_electoral && set.add(v.seccion_electoral));
        if (set.size === 0) {
            const secciones = await this.prisma.seccionINE.findMany({
                where: { ...baseWhere, municipio_id: 20 },
            });
            return this.formatearSecciones(secciones);
        }
        const secciones = await this.prisma.seccionINE.findMany({
            where: { ...baseWhere, seccion: { in: Array.from(set) } },
        });
        return this.formatearSecciones(secciones);
    }
    formatearSecciones(secciones) {
        const features = secciones
            .filter(s => s.coordenadas)
            .map(s => ({
            type: 'Feature',
            geometry: s.coordenadas,
            properties: {
                id: s.seccion,
                seccion: s.seccion,
                nombre: `Sección ${s.seccion}`,
                estado: s.estado,
                municipio: s.municipio,
                padron_2024: s.padron_2024,
                lista_nominal_2024: s.lista_nominal_2024,
            },
        }));
        return { type: 'FeatureCollection', features };
    }
    async geojsonLideres(tenantId) {
        const lideres = await this.prisma.lider.findMany({
            where: { tenant_id: tenantId, activo: true },
            include: { votante: true },
        });
        const features = lideres
            .map(l => ({ lider: l, coords: this.puntoDesde(l.votante?.coordenadas) }))
            .filter(item => item.coords)
            .map(({ lider: l, coords }) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coords },
            properties: {
                id: l.id,
                nombre: l.votante.nombre,
                telefono: l.votante.telefono,
                seccion_electoral: l.votante.seccion_electoral,
                colonia: l.votante.colonia,
                alcance_estimado: l.alcance_estimado,
                score: l.score,
                votante_id: l.votante_id,
            },
        }));
        return { type: 'FeatureCollection', features };
    }
    async geojsonVotantes(tenantId, query) {
        const limit = Math.min(parseInt(query.limit) || 2000, 10000);
        const votantes = await this.prisma.votante.findMany({
            where: { tenant_id: tenantId, activo: true, coordenadas: { not: null } },
            take: limit,
            orderBy: { created_at: 'desc' },
        });
        const features = votantes
            .map(v => ({ v, coords: this.puntoDesde(v.coordenadas) }))
            .filter(item => item.coords)
            .map(({ v, coords }) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coords },
            properties: {
                id: v.id,
                nombre: v.nombre,
                telefono: v.telefono,
                seccion_electoral: v.seccion_electoral,
                colonia: v.colonia,
                nivel_apoyo: v.nivel_apoyo,
                es_lider: v.es_lider,
            },
        }));
        return { type: 'FeatureCollection', features };
    }
    async geojsonApoyos(tenantId, query) {
        const limit = Math.min(parseInt(query.limit) || 2000, 10000);
        const desde = query.desde ? new Date(query.desde) : undefined;
        const hasta = query.hasta ? new Date(query.hasta) : undefined;
        const where = { tenant_id: tenantId, coordenadas: { not: null } };
        if (desde || hasta) {
            where.fecha_entrega = {};
            if (desde)
                where.fecha_entrega.gte = desde;
            if (hasta)
                where.fecha_entrega.lte = hasta;
        }
        const apoyos = await this.prisma.apoyo.findMany({
            where,
            take: limit,
            orderBy: { fecha_entrega: 'desc' },
            include: { votante: { select: { id: true, nombre: true, seccion_electoral: true, colonia: true } } },
        });
        const features = apoyos
            .map(a => ({ a, coords: this.puntoDesde(a.coordenadas) }))
            .filter(item => item.coords)
            .map(({ a, coords }) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coords },
            properties: {
                id: a.id,
                tipo_apoyo: a.tipo_apoyo,
                cantidad: a.cantidad,
                fecha_entrega: a.fecha_entrega,
                entregado_por: a.entregado_por,
                verificado: a.verificado,
                votante_id: a.votante_id,
                votante_nombre: a.votante?.nombre,
                seccion_electoral: a.votante?.seccion_electoral,
                observaciones: a.observaciones,
            },
        }));
        return { type: 'FeatureCollection', features };
    }
    async geojsonPeticiones(tenantId, query) {
        const limit = Math.min(parseInt(query.limit) || 2000, 10000);
        const estatus = query.estatus;
        const where = { tenant_id: tenantId, coordenadas: { not: null } };
        if (estatus)
            where.estatus = estatus;
        const peticiones = await this.prisma.peticion.findMany({
            where,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                votante: { select: { id: true, nombre: true, telefono: true } },
                creador: { select: { id: true, nombre: true } },
            },
        });
        const features = peticiones
            .map(p => ({ p, coords: this.puntoDesde(p.coordenadas) }))
            .filter(item => item.coords)
            .map(({ p, coords }) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coords },
            properties: {
                id: p.id,
                categoria: p.categoria,
                prioridad: p.prioridad,
                estatus: p.estatus,
                titulo: p.titulo,
                descripcion: p.descripcion,
                foto_url: p.foto_url,
                created_at: p.created_at,
                votante_id: p.votante_id,
                votante_nombre: p.votante?.nombre,
                creador_nombre: p.creador?.nombre,
            },
        }));
        return { type: 'FeatureCollection', features };
    }
    async geojsonEventos(tenantId) {
        const eventos = await this.prisma.evento.findMany({
            where: { tenant_id: tenantId },
            orderBy: { fecha_inicio: 'asc' },
        });
        const features = eventos
            .map(e => ({ e, coords: this.puntoDesde(e.coordenadas) }))
            .filter(item => item.coords)
            .map(({ e, coords }) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coords },
            properties: {
                id: e.id,
                nombre: e.nombre,
                direccion: e.direccion,
                fecha_inicio: e.fecha_inicio,
                fecha_fin: e.fecha_fin,
                status: e.status,
                qr_code: e.qr_code,
                tematica: e.tematica,
                zona_id: e.zona_id,
            },
        }));
        return { type: 'FeatureCollection', features };
    }
    async geojsonRecorridos(tenantId) {
        const recorridos = await this.prisma.recorrido.findMany({
            where: { tenant_id: tenantId },
            orderBy: { fecha: 'desc' },
            include: { usuario: { select: { id: true, nombre: true } } },
        });
        const features = recorridos
            .map(r => {
            const puntos = (r.coordenadas || [])
                .filter((p) => p && typeof p.lng === 'number' && typeof p.lat === 'number')
                .map((p) => [p.lng, p.lat]);
            return { r, puntos };
        })
            .filter(item => item.puntos.length >= 2)
            .map(({ r, puntos }) => ({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: puntos,
            },
            properties: {
                id: r.id,
                usuario_id: r.usuario_id,
                usuario_nombre: r.usuario?.nombre,
                fecha: r.fecha,
                distancia_km: r.distancia_km,
                duracion_min: r.duracion_min,
                secciones: r.secciones,
            },
        }));
        return { type: 'FeatureCollection', features };
    }
    async geojsonCapaPersonalizada(tenantId, capaId) {
        const capa = await this.prisma.capaMapa.findFirst({
            where: { id: capaId, tenant_id: tenantId, visible: true },
        });
        if (!capa || !capa.geojson)
            return undefined;
        const geo = capa.geojson;
        const collection = geo?.type === 'FeatureCollection'
            ? geo
            : { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: geo, properties: {} }] };
        const esIne = capa.tipo === 'secciones_ine';
        let datosSecciones = {};
        if (esIne) {
            const metadata = capa.metadata || {};
            const secciones = await this.prisma.seccionINE.findMany({
                where: {
                    tenant_id: tenantId,
                    estado_id: metadata.estado_id,
                    municipio_id: metadata.municipio_id,
                },
            });
            const resultados = await this.prisma.resultadoHistorico.findMany({
                where: {
                    seccion: { in: secciones.map(s => s.seccion) },
                },
                orderBy: { anio: 'desc' },
            });
            const resultadosPorSeccion = {};
            resultados.forEach(r => {
                if (!resultadosPorSeccion[r.seccion])
                    resultadosPorSeccion[r.seccion] = r;
            });
            secciones.forEach(s => {
                datosSecciones[s.seccion] = {
                    ...s,
                    resultado_historico: resultadosPorSeccion[s.seccion] || null,
                };
            });
        }
        const features = (collection.features || []).map((f) => {
            const props = f.properties || {};
            const extra = {
                capa_id: capa.id,
                capa_nombre: capa.nombre,
                capa_tipo: capa.tipo,
                capa_origen: capa.origen,
                color: capa.color,
            };
            if (esIne) {
                const info = datosSecciones[props.seccion];
                if (info) {
                    extra.padron_2024 = info.padron_2024;
                    extra.lista_nominal_2024 = info.lista_nominal_2024;
                    extra.distrito_federal = info.distrito_federal;
                    extra.distrito_local = info.distrito_local;
                    extra.estado = info.estado;
                    extra.municipio = info.municipio;
                    extra.resultado_historico = info.resultado_historico;
                }
            }
            return {
                ...f,
                properties: { ...props, ...extra },
            };
        });
        return { type: 'FeatureCollection', features };
    }
    async estadisticas(tenantId, nivel = 'seccion') {
        try {
            if (nivel === 'zona') {
                return await this.estadisticasPorZonaConDetalle(tenantId);
            }
            return await this.estadisticasPorSeccion(tenantId);
        }
        catch (err) {
            console.error('[MapasService.estadisticas] ERROR:', err?.message, err?.stack);
            throw err;
        }
    }
    async estadisticasPorSeccion(tenantId) {
        const [votantesRaw, apoyosRaw, lideresRaw, eventosRaw, seccionesINE] = await Promise.all([
            this.prisma.votante
                .findMany({
                where: { tenant_id: tenantId, activo: true, seccion_electoral: { not: null } },
                select: { seccion_electoral: true, nivel_apoyo: true },
            })
                .catch((e) => { console.error('[estadisticasPorSeccion] votantes error:', e?.message); return []; }),
            this.prisma.apoyo
                .findMany({
                where: { tenant_id: tenantId },
                include: { votante: { select: { seccion_electoral: true } } },
            })
                .catch((e) => { console.error('[estadisticasPorSeccion] apoyos error:', e?.message); return []; }),
            this.prisma.lider
                .findMany({
                where: { tenant_id: tenantId, activo: true },
                include: { votante: { select: { seccion_electoral: true } } },
            })
                .catch((e) => { console.error('[estadisticasPorSeccion] lideres error:', e?.message); return []; }),
            this.prisma.evento
                .findMany({
                where: { tenant_id: tenantId },
                include: { zona: { select: { secciones: true } } },
            })
                .catch((e) => { console.error('[estadisticasPorSeccion] eventos error:', e?.message); return []; }),
            this.prisma.seccionINE
                .findMany({ where: { tenant_id: tenantId } })
                .catch((e) => { console.error('[estadisticasPorSeccion] seccionesINE error:', e?.message); return []; }),
        ]);
        const votantes = Array.isArray(votantesRaw) ? votantesRaw : [];
        const apoyos = Array.isArray(apoyosRaw) ? apoyosRaw : [];
        const lideres = Array.isArray(lideresRaw) ? lideresRaw : [];
        const eventos = Array.isArray(eventosRaw) ? eventosRaw : [];
        const seccionInfo = {};
        seccionesINE.forEach(s => {
            seccionInfo[s.seccion] = {
                lista_nominal: s.lista_nominal_2024 || 1000,
                padron: s.padron_2024 || 900,
            };
        });
        const map = {};
        const getOrCreate = (clave) => {
            if (!map[clave]) {
                map[clave] = {
                    seccion: clave,
                    votantes: 0,
                    apoyos: 0,
                    lideres: 0,
                    eventos: 0,
                    votos_estimados: 0,
                    niveles_apoyo: {},
                    lista_nominal: seccionInfo[clave]?.lista_nominal || 1000,
                    padron: seccionInfo[clave]?.padron || 900,
                };
            }
            return map[clave];
        };
        votantes.forEach(v => {
            const item = getOrCreate(v.seccion_electoral);
            item.votantes += 1;
            item.votos_estimados += v.nivel_apoyo || 0;
            item.niveles_apoyo[v.nivel_apoyo || 0] = (item.niveles_apoyo[v.nivel_apoyo || 0] || 0) + 1;
        });
        apoyos.forEach(a => {
            if (a.votante?.seccion_electoral) {
                getOrCreate(a.votante.seccion_electoral).apoyos += 1;
            }
        });
        lideres.forEach(l => {
            if (l.votante?.seccion_electoral) {
                getOrCreate(l.votante.seccion_electoral).lideres += 1;
            }
        });
        eventos.forEach(e => {
            (e.zona?.secciones || []).forEach(s => {
                getOrCreate(s).eventos += 1;
            });
        });
        Object.values(map).forEach((item) => {
            const meta = Math.ceil(item.lista_nominal * 0.34);
            item.faltan_para_ganar = Math.max(0, meta - item.votos_estimados);
            const ratio = item.votos_estimados / meta;
            if (ratio >= 1)
                item.color = '#22C55E';
            else if (ratio >= 0.6)
                item.color = '#FACC15';
            else
                item.color = '#EF4444';
        });
        return {
            nivel: 'seccion',
            total_items: Object.keys(map).length,
            items: Object.values(map).sort((a, b) => b.votantes - a.votantes),
        };
    }
    async estadisticasPorZonaConDetalle(tenantId) {
        const zonas = await this.prisma.zona.findMany({
            where: { tenant_id: tenantId },
            include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
        });
        if (zonas.length === 0) {
            return { nivel: 'zona', total_items: 0, items: [] };
        }
        const stats = await this.estadisticasPorZona(tenantId, zonas);
        const items = zonas.map(z => {
            const st = stats.find(s => s.zona_id === z.id) || { votantes: 0, apoyos: 0, lideres: 0, eventos: 0 };
            return {
                clave: z.id,
                nombre: z.nombre,
                tipo: z.tipo,
                color: z.color,
                secciones: z.secciones || [],
                lider_id: z.lider_id,
                lider_nombre: z.lider?.votante?.nombre || null,
                meta_votos: z.meta_votos,
                votos_estimados: z.votos_estimados,
                ...st,
            };
        });
        return { nivel: 'zona', total_items: items.length, items: items.sort((a, b) => b.votantes - a.votantes) };
    }
    async estadisticasPorZona(tenantId, zonas) {
        const listaZonas = zonas || await this.prisma.zona.findMany({ where: { tenant_id: tenantId }, select: { id: true, secciones: true } });
        const seccionAZona = {};
        listaZonas.forEach(z => {
            (z.secciones || []).forEach(s => { seccionAZona[s] = z.id; });
        });
        const seccionesConZona = Object.keys(seccionAZona);
        if (seccionesConZona.length === 0)
            return [];
        const [votantes, apoyos, lideres, eventos] = await Promise.all([
            this.prisma.votante.findMany({
                where: { tenant_id: tenantId, activo: true, seccion_electoral: { in: seccionesConZona } },
                select: { seccion_electoral: true, nivel_apoyo: true },
            }),
            this.prisma.apoyo.findMany({
                where: { tenant_id: tenantId },
                include: { votante: { select: { seccion_electoral: true } } },
            }),
            this.prisma.lider.findMany({
                where: { tenant_id: tenantId, activo: true },
                include: { votante: { select: { seccion_electoral: true } } },
            }),
            this.prisma.evento.findMany({
                where: { tenant_id: tenantId, zona_id: { in: listaZonas.map(z => z.id) } },
                select: { zona_id: true },
            }),
        ]);
        const map = {};
        const getOrCreate = (zonaId) => {
            if (!map[zonaId])
                map[zonaId] = { zona_id: zonaId, votantes: 0, apoyos: 0, lideres: 0, eventos: 0, votos_estimados: 0 };
            return map[zonaId];
        };
        votantes.forEach(v => {
            const zonaId = seccionAZona[v.seccion_electoral];
            if (!zonaId)
                return;
            const item = getOrCreate(zonaId);
            item.votantes += 1;
            item.votos_estimados += v.nivel_apoyo || 0;
        });
        apoyos.forEach(a => {
            const zonaId = seccionAZona[a.votante?.seccion_electoral];
            if (!zonaId)
                return;
            getOrCreate(zonaId).apoyos += 1;
        });
        lideres.forEach(l => {
            const zonaId = seccionAZona[l.votante?.seccion_electoral];
            if (!zonaId)
                return;
            getOrCreate(zonaId).lideres += 1;
        });
        eventos.forEach(e => {
            if (e.zona_id)
                getOrCreate(e.zona_id).eventos += 1;
        });
        return Object.values(map);
    }
    async seedDemo(tenantId) {
        const centro = { lat: 21.125, lng: -101.6858 };
        const size = 0.02;
        const rows = 6;
        const cols = 6;
        const existentes = await this.prisma.seccionINE.count({ where: { tenant_id: tenantId, municipio_id: 20 } });
        if (existentes > 0) {
            return { creadas: 0, message: 'Ya existen secciones de León', total: existentes };
        }
        const batch = [];
        let idx = 1;
        for (let row = -Math.floor(rows / 2); row <= Math.floor(rows / 2); row++) {
            for (let col = -Math.floor(cols / 2); col <= Math.floor(cols / 2); col++) {
                const lat = centro.lat + row * size;
                const lng = centro.lng + col * size;
                const seccion = String(idx).padStart(4, '0');
                const listaNominal = 800 + Math.floor(Math.random() * 600);
                const padron = Math.floor(listaNominal * 0.95);
                batch.push({
                    tenant_id: tenantId,
                    seccion,
                    estado: 'Guanajuato',
                    estado_id: 11,
                    municipio: 'León',
                    municipio_id: 20,
                    padron_2024: padron,
                    lista_nominal_2024: listaNominal,
                    coordenadas: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [lng, lat],
                                [lng + size, lat],
                                [lng + size, lat + size],
                                [lng, lat + size],
                                [lng, lat],
                            ],
                        ],
                    },
                });
                idx++;
            }
        }
        const result = await this.prisma.seccionINE.createMany({ data: batch });
        return {
            creadas: result.count,
            message: `Se crearon ${result.count} secciones demo de León`,
            total: result.count,
        };
    }
};
exports.MapasService = MapasService;
exports.MapasService = MapasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MapasService);
//# sourceMappingURL=mapas.service.js.map