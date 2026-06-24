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
exports.ApoyosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
let ApoyosService = class ApoyosService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, tenantId) {
        return this.prisma.apoyo.findMany({
            where: { tenant_id: tenantId },
            orderBy: { fecha_entrega: 'desc' },
            take: query.limit ? parseInt(query.limit) : 100,
            include: { votante: { select: { id: true, nombre: true, seccion_electoral: true } } },
        });
    }
    async create(data, tenantId, userId) {
        if (!userId) {
            throw new common_1.BadRequestException('Usuario entregador no identificado');
        }
        const payload = {
            tenant_id: tenantId,
            votante_id: data.votante_id,
            tipo_apoyo: String(data.tipo_apoyo || '').trim(),
            cantidad: parseInt(data.cantidad, 10) || 1,
            observaciones: data.observaciones ? String(data.observaciones).trim() : null,
            entregado_por: userId,
            coordenadas: data.coordenadas || null,
        };
        if (data.foto_url)
            payload.foto_url = String(data.foto_url).trim();
        return this.prisma.apoyo.create({ data: payload });
    }
};
exports.ApoyosService = ApoyosService;
exports.ApoyosService = ApoyosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApoyosService);
//# sourceMappingURL=apoyos.service.js.map