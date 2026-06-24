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
exports.ZonasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const ZONA_TIPOS_VALIDOS = ['propia', 'externa', 'neutral'];
let ZonasService = class ZonasService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        return this.prisma.zona.findMany({
            where: { tenant_id: tenantId },
            include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
        });
    }
    async findOne(id, tenantId) {
        const zona = await this.prisma.zona.findFirst({
            where: { id, tenant_id: tenantId },
            include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
        });
        if (!zona)
            throw new common_1.NotFoundException('Zona no encontrada');
        return zona;
    }
    async create(data, tenantId, userId) {
        const payload = this.normalizar(data, tenantId, userId);
        return this.prisma.zona.create({
            data: payload,
            include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
        });
    }
    async update(id, data, tenantId, userId) {
        await this.findOne(id, tenantId);
        const payload = this.normalizar(data, tenantId, userId, true);
        return this.prisma.zona.update({
            where: { id },
            data: payload,
            include: { lider: { include: { votante: { select: { id: true, nombre: true } } } } },
        });
    }
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.zona.update({
            where: { id },
            data: { activa: false },
        });
    }
    normalizar(data, tenantId, userId, esUpdate = false) {
        const payload = {};
        if (!esUpdate) {
            payload.tenant_id = tenantId;
            payload.activa = true;
        }
        if (data.nombre !== undefined)
            payload.nombre = String(data.nombre).trim();
        if (data.secciones !== undefined) {
            payload.secciones = Array.isArray(data.secciones)
                ? data.secciones.map(String).filter(Boolean)
                : [];
        }
        if (data.coordenadas !== undefined) {
            if (data.coordenadas === null) {
                payload.coordenadas = null;
            }
            else {
                this.validarPolygon(data.coordenadas);
                payload.coordenadas = data.coordenadas;
            }
        }
        if (data.color !== undefined)
            payload.color = String(data.color).trim();
        if (data.activa !== undefined)
            payload.activa = Boolean(data.activa);
        if (data.tipo !== undefined) {
            const tipo = String(data.tipo).trim().toLowerCase();
            if (!ZONA_TIPOS_VALIDOS.includes(tipo)) {
                throw new common_1.BadRequestException(`Tipo de zona inválido: ${tipo}`);
            }
            payload.tipo = tipo;
        }
        if (data.lider_id !== undefined) {
            payload.lider_id = data.lider_id || null;
        }
        if (data.meta_votos !== undefined)
            payload.meta_votos = this.parsearEntero(data.meta_votos);
        if (data.votos_estimados !== undefined)
            payload.votos_estimados = this.parsearEntero(data.votos_estimados);
        if (data.descripcion !== undefined)
            payload.descripcion = data.descripcion ? String(data.descripcion).trim() : null;
        if (data.orden !== undefined)
            payload.orden = this.parsearEntero(data.orden, 0);
        if (userId && !esUpdate)
            payload.created_by = userId;
        return payload;
    }
    validarPolygon(geojson) {
        if (!geojson || typeof geojson !== 'object') {
            throw new common_1.BadRequestException('Las coordenadas deben ser un objeto GeoJSON');
        }
        if (geojson.type !== 'Polygon' && geojson.type !== 'MultiPolygon') {
            throw new common_1.BadRequestException('Las coordenadas de zona deben ser Polygon o MultiPolygon');
        }
        if (!Array.isArray(geojson.coordinates)) {
            throw new common_1.BadRequestException('GeoJSON inválido: falta coordinates');
        }
    }
    parsearEntero(value, defaultValue) {
        if (value === null || value === undefined || value === '')
            return defaultValue ?? null;
        const n = Number(value);
        if (!Number.isFinite(n) || !Number.isInteger(n))
            return defaultValue ?? null;
        return n;
    }
};
exports.ZonasService = ZonasService;
exports.ZonasService = ZonasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ZonasService);
//# sourceMappingURL=zonas.service.js.map