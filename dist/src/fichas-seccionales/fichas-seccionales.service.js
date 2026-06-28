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
exports.FichasSeccionalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
let FichasSeccionalesService = class FichasSeccionalesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async secciones(tenantId) {
        const raw = await this.prisma.votante.groupBy({
            by: ['seccion_electoral'],
            where: { tenant_id: tenantId, activo: true },
            _count: { id: true },
        });
        const ordenadas = raw
            .map((r) => r.seccion_electoral || 'Sin sección')
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        return [...new Set(ordenadas)];
    }
    async ficha(seccion, tenantId) {
        const [votantes, lideres, apoyos, eventos, mensajes, casillas, metas, resultados, seccionIne] = await Promise.all([
            this.prisma.votante.count({ where: { tenant_id: tenantId, seccion_electoral: seccion, activo: true } }),
            this.prisma.lider.count({
                where: {
                    tenant_id: tenantId,
                    activo: true,
                    votante: { seccion_electoral: seccion },
                },
            }),
            this.prisma.apoyo.count({
                where: {
                    tenant_id: tenantId,
                    votante: { seccion_electoral: seccion },
                },
            }),
            this.prisma.evento.count({ where: { tenant_id: tenantId, zona: { secciones: { has: seccion } } } }),
            this.prisma.mensaje.count({
                where: {
                    tenant_id: tenantId,
                    votante: { seccion_electoral: seccion },
                },
            }),
            this.prisma.casilla.findMany({
                where: { tenant_id: tenantId, seccion },
                orderBy: { tipo: 'asc' },
                include: { responsable: { select: { id: true, nombre: true } } },
            }),
            this.prisma.metaVotacion.findMany({
                where: { tenant_id: tenantId, seccion },
                orderBy: { created_at: 'desc' },
                include: { zona: { select: { id: true, nombre: true } } },
            }),
            this.prisma.resultadoHistorico.findMany({
                where: { tenant_id: tenantId, seccion },
                orderBy: { anio: 'desc' },
            }),
            this.prisma.seccionINE.findFirst({
                where: { tenant_id: tenantId, seccion },
                select: { lista_nominal_2024: true, padron_2024: true, municipio: true, estado: true },
            }),
        ]);
        const listaNominal = seccionIne?.lista_nominal_2024 || seccionIne?.padron_2024 || undefined;
        const meta = metas[0];
        const votosEstimados = Math.round(votantes * 0.7 + lideres * 10);
        const faltan = meta ? Math.max(0, meta.meta_votos - votosEstimados) : undefined;
        const tendencia = meta
            ? votosEstimados / meta.meta_votos >= 0.95
                ? 'arriba'
                : votosEstimados / meta.meta_votos >= 0.75
                    ? 'peleado'
                    : 'abajo'
            : 'sin_datos';
        return {
            seccion,
            votantes,
            lideres,
            apoyos,
            eventos,
            mensajes,
            casillas,
            metas,
            resultados: resultados.map((r) => ({
                anio: r.anio,
                partido_ganador: r.partido_ganador,
                votos_ganador: r.votos_ganador,
                votos_totales: r.votos_totales,
                participacion_pct: r.participacion_pct,
            })),
            lista_nominal_2024: listaNominal,
            proyeccion: {
                seccion,
                votantes,
                apoyos,
                lideres,
                lista_nominal_2024: listaNominal,
                meta_votos: meta?.meta_votos,
                votos_estimados: votosEstimados,
                faltan_para_ganar: faltan,
                tendencia,
            },
        };
    }
    async comparativa(secciones, tenantId) {
        if (!Array.isArray(secciones) || secciones.length === 0)
            throw new common_1.NotFoundException('Secciones requeridas');
        return Promise.all(secciones.map((s) => this.ficha(s, tenantId)));
    }
};
exports.FichasSeccionalesService = FichasSeccionalesService;
exports.FichasSeccionalesService = FichasSeccionalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FichasSeccionalesService);
//# sourceMappingURL=fichas-seccionales.service.js.map