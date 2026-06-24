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
exports.PeticionesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const client_1 = require("@prisma/client");
const CATEGORIAS = Object.values(client_1.CategoriaPeticion);
const PRIORIDADES = Object.values(client_1.PrioridadPeticion);
const ESTATUS = Object.values(client_1.EstatusPeticion);
let PeticionesService = class PeticionesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, tenantId) {
        const where = { tenant_id: tenantId };
        if (query.estatus && ESTATUS.includes(query.estatus))
            where.estatus = query.estatus;
        if (query.categoria && CATEGORIAS.includes(query.categoria))
            where.categoria = query.categoria;
        if (query.prioridad && PRIORIDADES.includes(query.prioridad))
            where.prioridad = query.prioridad;
        return this.prisma.peticion.findMany({
            where,
            take: query.limit ? parseInt(query.limit, 10) : 500,
            orderBy: { created_at: 'desc' },
            include: {
                votante: { select: { id: true, nombre: true, telefono: true } },
                creador: { select: { id: true, nombre: true } },
            },
        });
    }
    async findOne(id, tenantId) {
        const peticion = await this.prisma.peticion.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                votante: { select: { id: true, nombre: true, telefono: true } },
                creador: { select: { id: true, nombre: true } },
            },
        });
        if (!peticion)
            throw new common_1.NotFoundException('Petición no encontrada');
        return peticion;
    }
    async create(data, tenantId, userId) {
        const categoria = CATEGORIAS.includes(data.categoria) ? data.categoria : 'otro';
        const prioridad = PRIORIDADES.includes(data.prioridad) ? data.prioridad : 'media';
        const payload = {
            tenant_id: tenantId,
            created_by: userId,
            categoria,
            prioridad,
            estatus: 'reportada',
            titulo: data.titulo ? String(data.titulo).trim() : null,
            descripcion: String(data.descripcion || '').trim(),
            coordenadas: data.coordenadas || null,
            foto_url: data.foto_url ? String(data.foto_url).trim() : null,
        };
        if (data.votante_id)
            payload.votante_id = data.votante_id;
        if (!payload.descripcion) {
            throw new common_1.BadRequestException('La descripción de la petición es requerida');
        }
        return this.prisma.peticion.create({
            data: payload,
            include: {
                votante: { select: { id: true, nombre: true } },
                creador: { select: { id: true, nombre: true } },
            },
        });
    }
    async updateEstatus(id, estatus, tenantId) {
        if (!ESTATUS.includes(estatus)) {
            throw new common_1.BadRequestException('Estatus inválido');
        }
        await this.findOne(id, tenantId);
        return this.prisma.peticion.update({
            where: { id },
            data: { estatus: estatus },
            include: {
                votante: { select: { id: true, nombre: true } },
                creador: { select: { id: true, nombre: true } },
            },
        });
    }
};
exports.PeticionesService = PeticionesService;
exports.PeticionesService = PeticionesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PeticionesService);
//# sourceMappingURL=peticiones.service.js.map