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
exports.VotantesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
let VotantesService = class VotantesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, tenantId) {
        const where = { activo: true };
        if (tenantId)
            where.tenant_id = tenantId;
        if (query.search) {
            const term = String(query.search).toLowerCase();
            where.OR = [
                { nombre: { contains: term, mode: 'insensitive' } },
                { telefono: { contains: term, mode: 'insensitive' } },
                { colonia: { contains: term, mode: 'insensitive' } },
                { seccion_electoral: { contains: term, mode: 'insensitive' } },
            ];
        }
        return this.prisma.votante.findMany({
            where,
            take: query.limit ? parseInt(query.limit) : 100,
            orderBy: { created_at: 'desc' },
        });
    }
    async findOne(id) {
        return this.prisma.votante.findUnique({
            where: { id },
        });
    }
    async create(data, tenantId) {
        const payload = this.normalizarVotante(data, tenantId);
        return this.prisma.votante.create({ data: payload });
    }
    async update(id, data) {
        const payload = { ...data };
        delete payload.id;
        delete payload.tenant_id;
        delete payload.created_at;
        if (payload.tags && typeof payload.tags === 'string') {
            payload.tags = payload.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
        }
        return this.prisma.votante.update({
            where: { id },
            data: payload,
        });
    }
    async getStats(tenantId) {
        const baseWhere = { activo: true };
        if (tenantId)
            baseWhere.tenant_id = tenantId;
        const [total, nuevosHoy, porNivel] = await Promise.all([
            this.prisma.votante.count({ where: baseWhere }),
            this.prisma.votante.count({
                where: {
                    ...baseWhere,
                    created_at: { gte: this.inicioDia() },
                },
            }),
            this.prisma.votante.groupBy({
                by: ['nivel_apoyo'],
                where: baseWhere,
                _count: { id: true },
            }),
        ]);
        const niveles = Object.fromEntries(porNivel.map((n) => [n.nivel_apoyo || 0, n._count.id]));
        return { total, nuevosHoy, niveles };
    }
    async importar(rows, tenantId) {
        if (!tenantId) {
            throw new common_1.BadRequestException('Tenant no especificado');
        }
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new common_1.BadRequestException('No se recibieron registros para importar');
        }
        const maxLote = 2000;
        if (rows.length > maxLote) {
            throw new common_1.BadRequestException(`El lote excede el límite de ${maxLote} registros. Sube el archivo en partes.`);
        }
        const normalizados = rows
            .map((r, index) => this.normalizarFilaImportacion(r, index, tenantId))
            .filter(Boolean);
        if (normalizados.length === 0) {
            throw new common_1.BadRequestException('Ningún registro válido para importar');
        }
        const telefonos = normalizados
            .map((n) => n.telefono_hash)
            .filter(Boolean);
        const existentes = telefonos.length
            ? await this.prisma.votante.findMany({
                where: { tenant_id: tenantId, telefono_hash: { in: telefonos } },
                select: { telefono_hash: true },
            })
            : [];
        const telefonosExistentes = new Set(existentes.map((e) => e.telefono_hash));
        const paraInsertar = [];
        const duplicados = [];
        for (const n of normalizados) {
            if (n.telefono_hash && telefonosExistentes.has(n.telefono_hash)) {
                duplicados.push(n.__fila);
                continue;
            }
            if (n.telefono_hash)
                telefonosExistentes.add(n.telefono_hash);
            delete n.__fila;
            paraInsertar.push(n);
        }
        if (paraInsertar.length === 0) {
            return {
                totalRecibidos: rows.length,
                insertados: 0,
                duplicados: duplicados.length,
                errores: [],
            };
        }
        const resultado = await this.prisma.votante.createMany({
            data: paraInsertar,
        });
        return {
            totalRecibidos: rows.length,
            insertados: resultado.count,
            duplicados: duplicados.length,
            errores: [],
        };
    }
    normalizarFilaImportacion(row, index, tenantId) {
        try {
            const data = this.normalizarVotante(row, tenantId);
            return { ...data, __fila: index + 1 };
        }
        catch (err) {
            return null;
        }
    }
    normalizarVotante(data, tenantId) {
        const payload = {};
        const finalTenantId = tenantId || data.tenant_id;
        if (finalTenantId)
            payload.tenant_id = finalTenantId;
        payload.nombre = this.limpiarTexto(data.nombre || data.Nombre || data.nombre_completo || data.NOMBRE || '');
        payload.telefono = this.limpiarTelefono(data.telefono || data.Telefono || data.Teléfono || data.TELEFONO || data.whatsapp || data.WhatsApp || data.celular || data.Celular || '');
        payload.telefono_hash = payload.telefono ? this.hashSimple(payload.telefono) : null;
        payload.email = this.limpiarTexto(data.email || data.Email || data.EMAIL || data.correo || data.Correo || '');
        payload.curp = this.limpiarTexto(data.curp || data.CURP || '');
        payload.seccion_electoral = this.limpiarTexto(data.seccion_electoral || data.seccion || data.Seccion || data.Sección || data.SECCION || '', 4);
        payload.colonia = this.limpiarTexto(data.colonia || data.Colonia || data.COLONIA || '');
        payload.municipio = this.limpiarTexto(data.municipio || data.Municipio || data.MUNICIPIO || '');
        payload.estado = this.limpiarTexto(data.estado || data.Estado || data.ESTADO || '');
        const coords = data.coordenadas || data.coordenadas_gps || data.ubicacion;
        let lat = null;
        let lng = null;
        if (coords && typeof coords === 'object') {
            lat = this.parsearNumero(coords.lat ?? coords.latitud ?? coords.latitude);
            lng = this.parsearNumero(coords.lng ?? coords.longitud ?? coords.longitude ?? coords.lon);
        }
        if (lat === null) {
            lat = this.parsearNumero(data.latitud || data.lat || data.Latitud || data.LATITUD);
        }
        if (lng === null) {
            lng = this.parsearNumero(data.longitud || data.lng || data.lon || data.Longitud || data.LONGITUD);
        }
        if (lat !== null && lng !== null) {
            payload.coordenadas = { lat, lng };
        }
        payload.nivel_apoyo = this.parsearNivelApoyo(data.nivel_apoyo || data.nivel || data.Nivel || data.NIVEL);
        const tagsRaw = data.tags || data.Tags || data.TAGS || data.etiquetas || data.Etiquetas || '';
        if (typeof tagsRaw === 'string') {
            payload.tags = tagsRaw
                .split(/[,;|]+/)
                .map((t) => t.trim())
                .filter(Boolean);
        }
        else if (Array.isArray(tagsRaw)) {
            payload.tags = tagsRaw.map(String).filter(Boolean);
        }
        else {
            payload.tags = [];
        }
        payload.origen_qr = this.limpiarTexto(data.origen_qr || data.origen || data.Origen || data.ORIGEN || 'importacion') || 'importacion';
        payload.activo = true;
        if (data.es_lider === true || data.es_lider === 'true' || data.es_lider === 1)
            payload.es_lider = true;
        return payload;
    }
    limpiarTexto(value, maxLength) {
        if (value === null || value === undefined)
            return null;
        let text = String(value).trim();
        if (maxLength && text.length > maxLength)
            text = text.slice(0, maxLength);
        return text || null;
    }
    limpiarTelefono(value) {
        if (!value)
            return null;
        const digits = String(value).replace(/\D/g, '');
        if (digits.length < 10)
            return null;
        if (digits.startsWith('52') && digits.length >= 12) {
            return `+${digits}`;
        }
        if (digits.length === 10) {
            return `+52${digits}`;
        }
        return `+${digits}`;
    }
    hashSimple(value) {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            const char = value.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(12, '0');
    }
    parsearNumero(value) {
        if (value === null || value === undefined || value === '')
            return null;
        const n = Number(String(value).replace(/,/g, '.'));
        return Number.isFinite(n) ? n : null;
    }
    parsearNivelApoyo(value) {
        if (value === null || value === undefined || value === '')
            return null;
        const n = parseInt(String(value), 10);
        if (Number.isNaN(n))
            return null;
        return Math.min(Math.max(n, 1), 5);
    }
    inicioDia() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }
};
exports.VotantesService = VotantesService;
exports.VotantesService = VotantesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VotantesService);
//# sourceMappingURL=votantes.service.js.map