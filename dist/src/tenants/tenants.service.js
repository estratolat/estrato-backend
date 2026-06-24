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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
let TenantsService = class TenantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findBySlug(slug) {
        return this.prisma.tenant.findUnique({
            where: { slug },
        });
    }
    async findById(id) {
        return this.prisma.tenant.findUnique({
            where: { id },
        });
    }
    async getOrThrow(slug) {
        const tenant = await this.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException(`Tenant ${slug} no encontrado`);
        }
        return tenant;
    }
    async create(data) {
        return this.prisma.tenant.create({
            data: {
                ...data,
                plan: data.plan || 'basico',
                activo: true,
            },
        });
    }
    async getLandingData(slug) {
        const tenant = await this.getOrThrow(slug);
        const stats = await this.getStats(tenant.id);
        const eventos = await this.prisma.evento.findMany({
            where: {
                tenant_id: tenant.id,
                status: { not: 'cancelado' },
                fecha_inicio: { gte: new Date() },
            },
            orderBy: { fecha_inicio: 'asc' },
            take: 5,
        });
        return {
            tenant: {
                slug: tenant.slug,
                nombre_candidato: tenant.nombre_candidato,
                cargo_busca: tenant.cargo_busca,
                slogan: tenant.slogan,
            },
            stats: {
                totalSimpatizantes: stats.totalVotantes,
                totalEventos: stats.totalEventos,
            },
            eventos: eventos.map((e) => ({
                id: e.id,
                nombre: e.nombre,
                descripcion: e.descripcion,
                direccion: e.direccion,
                fecha: e.fecha_inicio,
                coordenadas: e.coordenadas,
            })),
        };
    }
    async update(id, data) {
        return this.prisma.tenant.update({
            where: { id },
            data,
        });
    }
    async toggleVeda(id, veda_activa) {
        return this.prisma.tenant.update({
            where: { id },
            data: { veda_activa },
        });
    }
    async getStats(tenantId) {
        const [totalVotantes, totalLideres, totalEventos, totalApoyos, apoyosMes,] = await Promise.all([
            this.prisma.votante.count({ where: { tenant_id: tenantId } }),
            this.prisma.lider.count({ where: { tenant_id: tenantId } }),
            this.prisma.evento.count({ where: { tenant_id: tenantId } }),
            this.prisma.apoyo.count({ where: { tenant_id: tenantId } }),
            this.prisma.apoyo.count({
                where: {
                    tenant_id: tenantId,
                    created_at: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            totalVotantes,
            totalLideres,
            totalEventos,
            totalApoyos,
            apoyosMes,
        };
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map