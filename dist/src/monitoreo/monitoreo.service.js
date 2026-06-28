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
exports.MonitoreoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
let MonitoreoService = class MonitoreoService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resumen(tenantId) {
        const [total, sinReportar, abiertas, cerradas, incidencias, esperados] = await Promise.all([
            this.prisma.casilla.count({ where: { tenant_id: tenantId } }),
            this.prisma.casilla.count({ where: { tenant_id: tenantId, status: 'sin_reportar' } }),
            this.prisma.casilla.count({ where: { tenant_id: tenantId, status: 'abierta' } }),
            this.prisma.casilla.count({ where: { tenant_id: tenantId, status: 'cerrada' } }),
            this.prisma.casilla.count({ where: { tenant_id: tenantId, status: 'incidencia' } }),
            this.prisma.casilla.aggregate({ where: { tenant_id: tenantId }, _sum: { electores_esperados: true } }),
        ]);
        return {
            total_casillas: total,
            sin_reportar: sinReportar,
            abiertas,
            cerradas,
            incidencias,
            votantes_esperados: esperados._sum.electores_esperados || 0,
            cobertura_pct: total ? Math.round((cerradas / total) * 100) : 0,
        };
    }
    async porSeccion(tenantId) {
        const casillas = await this.prisma.casilla.findMany({
            where: { tenant_id: tenantId },
            orderBy: { seccion: 'asc' },
        });
        const agrupado = {};
        casillas.forEach((c) => {
            if (!agrupado[c.seccion]) {
                agrupado[c.seccion] = { seccion: c.seccion, total: 0, abiertas: 0, cerradas: 0, incidencias: 0, sin_reportar: 0, esperados: 0 };
            }
            agrupado[c.seccion].total += 1;
            agrupado[c.seccion].esperados += c.electores_esperados || 0;
            if (c.status === 'abierta')
                agrupado[c.seccion].abiertas += 1;
            if (c.status === 'cerrada')
                agrupado[c.seccion].cerradas += 1;
            if (c.status === 'incidencia')
                agrupado[c.seccion].incidencias += 1;
            if (c.status === 'sin_reportar')
                agrupado[c.seccion].sin_reportar += 1;
        });
        return Object.values(agrupado);
    }
    async casillas(query, tenantId) {
        const where = { tenant_id: tenantId };
        if (query.seccion)
            where.seccion = String(query.seccion);
        if (query.status)
            where.status = String(query.status);
        return this.prisma.casilla.findMany({
            where,
            orderBy: { seccion: 'asc' },
            take: query.limit ? parseInt(query.limit, 10) : 500,
            include: { responsable: { select: { id: true, nombre: true } } },
        });
    }
    async incidencias(tenantId) {
        return this.prisma.casilla.findMany({
            where: { tenant_id: tenantId, status: 'incidencia' },
            orderBy: { created_at: 'desc' },
            include: { responsable: { select: { id: true, nombre: true } } },
        });
    }
};
exports.MonitoreoService = MonitoreoService;
exports.MonitoreoService = MonitoreoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MonitoreoService);
//# sourceMappingURL=monitoreo.service.js.map