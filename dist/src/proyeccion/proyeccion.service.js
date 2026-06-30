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
exports.ProyeccionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
let ProyeccionService = class ProyeccionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMetas(query, tenantId) {
        const where = { tenant_id: tenantId };
        if (query.seccion)
            where.seccion = String(query.seccion);
        if (query.zona_id)
            where.zona_id = String(query.zona_id);
        if (query.proceso)
            where.proceso = String(query.proceso);
        return this.prisma.metaVotacion.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: { zona: { select: { id: true, nombre: true } } },
        });
    }
    async createMeta(data, tenantId) {
        const proceso = String(data.proceso || '').trim() || String(new Date().getFullYear());
        const seccion = data.seccion ? String(data.seccion).trim() : null;
        const zona_id = data.zona_id || null;
        const meta_votos = data.meta_votos ? parseInt(data.meta_votos, 10) : 0;
        if (!seccion && !zona_id)
            throw new common_1.BadRequestException('Defina sección o zona');
        if (meta_votos <= 0)
            throw new common_1.BadRequestException('Meta de votos inválida');
        return this.prisma.metaVotacion.create({
            data: {
                tenant_id: tenantId,
                proceso,
                seccion,
                zona_id,
                meta_votos,
                meta_lista_nominal: data.meta_lista_nominal ? parseInt(data.meta_lista_nominal, 10) : null,
                meta_participacion: data.meta_participacion ? parseFloat(data.meta_participacion) : null,
            },
            include: { zona: { select: { id: true, nombre: true } } },
        });
    }
    async updateMeta(id, data, tenantId) {
        const meta = await this.prisma.metaVotacion.findFirst({ where: { id, tenant_id: tenantId } });
        if (!meta)
            throw new common_1.NotFoundException('Meta no encontrada');
        const payload = {};
        if (data.meta_votos !== undefined) {
            const v = parseInt(data.meta_votos, 10);
            if (v <= 0)
                throw new common_1.BadRequestException('Meta de votos inválida');
            payload.meta_votos = v;
        }
        if (data.meta_lista_nominal !== undefined)
            payload.meta_lista_nominal = data.meta_lista_nominal ? parseInt(data.meta_lista_nominal, 10) : null;
        if (data.meta_participacion !== undefined)
            payload.meta_participacion = data.meta_participacion ? parseFloat(data.meta_participacion) : null;
        return this.prisma.metaVotacion.update({ where: { id: meta.id }, data: payload });
    }
    async removeMeta(id, tenantId) {
        const meta = await this.prisma.metaVotacion.findFirst({ where: { id, tenant_id: tenantId } });
        if (!meta)
            throw new common_1.NotFoundException('Meta no encontrada');
        await this.prisma.metaVotacion.delete({ where: { id: meta.id } });
        return { ok: true };
    }
    async resumen(tenantId) {
        const [totalVotantes, totalApoyos, totalLideres, totalMetas, globalMeta] = await Promise.all([
            this.prisma.votante.count({ where: { tenant_id: tenantId, activo: true } }),
            this.prisma.apoyo.count({ where: { tenant_id: tenantId } }),
            this.prisma.lider.count({ where: { tenant_id: tenantId, activo: true } }),
            this.prisma.metaVotacion.aggregate({ where: { tenant_id: tenantId, seccion: null, zona_id: null }, _sum: { meta_votos: true } }),
            this.prisma.metaVotacion.findFirst({
                where: { tenant_id: tenantId, seccion: null, zona_id: null },
                orderBy: { created_at: 'desc' },
            }),
        ]);
        const padronTotal = globalMeta?.meta_lista_nominal || totalVotantes;
        const metaVotosTotal = globalMeta?.meta_votos || totalMetas._sum.meta_votos || 0;
        return {
            votantes_registrados: padronTotal,
            votantes_capturados: totalVotantes,
            apoyos_registrados: totalApoyos,
            lideres_registrados: totalLideres,
            meta_votos_total: metaVotosTotal,
            meta_participacion: globalMeta?.meta_participacion ?? null,
            meta_lista_nominal: globalMeta?.meta_lista_nominal ?? null,
            brecha: metaVotosTotal - padronTotal,
            avance_padron: padronTotal > 0 ? Math.round((totalVotantes / padronTotal) * 1000) / 10 : 0,
        };
    }
    async porSeccion(tenantId) {
        const seccionesRaw = await this.prisma.votante.groupBy({
            by: ['seccion_electoral'],
            where: { tenant_id: tenantId, activo: true },
            _count: { id: true },
        });
        const lideresRaw = await this.prisma.lider.findMany({
            where: { tenant_id: tenantId, activo: true },
            include: { votante: { select: { seccion_electoral: true } } },
        });
        const metasRaw = await this.prisma.metaVotacion.findMany({
            where: { tenant_id: tenantId },
            orderBy: { created_at: 'desc' },
            include: { zona: { select: { id: true, nombre: true } } },
        });
        const historicoRaw = await this.prisma.resultadoHistorico.findMany({
            where: { tenant_id: tenantId },
            orderBy: { anio: 'desc' },
        });
        const porSeccion = new Map();
        seccionesRaw.forEach((s) => {
            if (!s.seccion_electoral)
                return;
            const sec = s.seccion_electoral;
            porSeccion.set(sec, {
                seccion: sec,
                votantes: s._count.id,
                apoyos: 0,
                lideres: 0,
                lista_nominal_2024: undefined,
                meta_votos: undefined,
                votos_estimados: Math.round(s._count.id * 0.7),
                tendencia: 'sin_datos',
            });
        });
        lideresRaw.forEach((l) => {
            if (!l.votante?.seccion_electoral)
                return;
            const sec = l.votante.seccion_electoral;
            const r = porSeccion.get(sec) || {
                seccion: sec,
                votantes: 0,
                apoyos: 0,
                lideres: 0,
                lista_nominal_2024: undefined,
                meta_votos: undefined,
                votos_estimados: 0,
                tendencia: 'sin_datos',
            };
            r.lideres += 1;
            porSeccion.set(sec, r);
        });
        metasRaw.forEach((m) => {
            const key = m.seccion || (m.zona?.nombre ?? null);
            if (!key)
                return;
            if (!porSeccion.has(key)) {
                porSeccion.set(key, {
                    seccion: key,
                    votantes: 0,
                    apoyos: 0,
                    lideres: 0,
                    lista_nominal_2024: undefined,
                    meta_votos: undefined,
                    votos_estimados: 0,
                    tendencia: 'sin_datos',
                });
            }
            const r = porSeccion.get(key);
            r.meta_votos = m.meta_votos;
            r.lista_nominal_2024 = m.meta_lista_nominal;
            r.votos_estimados = Math.round(r.votantes * 0.7 + r.lideres * 10 + r.apoyos * 0.5);
            r.faltan_para_ganar = Math.max(0, m.meta_votos - r.votos_estimados);
        });
        historicoRaw.forEach((h) => {
            if (porSeccion.has(h.seccion)) {
                const r = porSeccion.get(h.seccion);
                r.participacion_historica = h.participacion_pct;
                if (h.participacion_pct) {
                    r.votos_estimados = Math.round(r.votantes * (h.participacion_pct / 100));
                }
            }
        });
        porSeccion.forEach((r) => {
            if (r.meta_votos && r.meta_votos > 0) {
                const ratio = r.votos_estimados / r.meta_votos;
                if (ratio >= 0.95)
                    r.tendencia = 'arriba';
                else if (ratio >= 0.75)
                    r.tendencia = 'peleado';
                else
                    r.tendencia = 'abajo';
            }
        });
        return Array.from(porSeccion.values()).sort((a, b) => a.seccion.localeCompare(b.seccion, undefined, { numeric: true }));
    }
};
exports.ProyeccionService = ProyeccionService;
exports.ProyeccionService = ProyeccionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProyeccionService);
//# sourceMappingURL=proyeccion.service.js.map