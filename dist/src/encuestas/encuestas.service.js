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
exports.EncuestasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const client_1 = require("@prisma/client");
const ESTATUS = Object.values(client_1.EstatusEncuesta);
function validarPreguntas(preguntas) {
    if (!Array.isArray(preguntas))
        throw new common_1.BadRequestException('Las preguntas deben ser un arreglo');
    for (const p of preguntas) {
        if (!p.texto || !String(p.texto).trim()) {
            throw new common_1.BadRequestException('Toda pregunta debe tener un texto');
        }
        if (!['texto', 'opcion_unica', 'opcion_multiple', 'escala', 'si_no'].includes(p.tipo)) {
            throw new common_1.BadRequestException(`Tipo de pregunta inválido: ${p.tipo}`);
        }
        if (['opcion_unica', 'opcion_multiple'].includes(p.tipo) && (!Array.isArray(p.opciones) || p.opciones.length < 2)) {
            throw new common_1.BadRequestException(`La pregunta "${p.texto}" necesita al menos 2 opciones`);
        }
    }
}
let EncuestasService = class EncuestasService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, tenantId) {
        const where = { tenant_id: tenantId };
        if (query.status && ESTATUS.includes(query.status))
            where.status = query.status;
        if (query.q)
            where.titulo = { contains: query.q, mode: 'insensitive' };
        return this.prisma.encuesta.findMany({
            where,
            take: query.limit ? parseInt(query.limit, 10) : 200,
            orderBy: { created_at: 'desc' },
            include: {
                creador: { select: { id: true, nombre: true } },
                _count: { select: { respuestas: true } },
            },
        });
    }
    async findOne(id, tenantId) {
        const encuesta = await this.prisma.encuesta.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                creador: { select: { id: true, nombre: true } },
                _count: { select: { respuestas: true } },
            },
        });
        if (!encuesta)
            throw new common_1.NotFoundException('Encuesta no encontrada');
        return encuesta;
    }
    async create(data, tenantId, userId) {
        const titulo = String(data.titulo || '').trim();
        if (!titulo)
            throw new common_1.BadRequestException('El título de la encuesta es requerido');
        const preguntas = Array.isArray(data.preguntas) ? data.preguntas : [];
        validarPreguntas(preguntas);
        return this.prisma.encuesta.create({
            data: {
                tenant_id: tenantId,
                created_by: userId,
                titulo,
                descripcion: data.descripcion ? String(data.descripcion).trim() : null,
                status: ESTATUS.includes(data.status) ? data.status : 'borrador',
                preguntas,
            },
            include: { creador: { select: { id: true, nombre: true } } },
        });
    }
    async update(id, data, tenantId) {
        const encuesta = await this.findOne(id, tenantId);
        const payload = {};
        if (data.titulo !== undefined) {
            const titulo = String(data.titulo).trim();
            if (!titulo)
                throw new common_1.BadRequestException('El título es requerido');
            payload.titulo = titulo;
        }
        if (data.descripcion !== undefined)
            payload.descripcion = String(data.descripcion).trim() || null;
        if (data.status !== undefined && ESTATUS.includes(data.status))
            payload.status = data.status;
        if (data.preguntas !== undefined) {
            validarPreguntas(data.preguntas);
            payload.preguntas = data.preguntas;
        }
        return this.prisma.encuesta.update({
            where: { id: encuesta.id },
            data: payload,
            include: { creador: { select: { id: true, nombre: true } }, _count: { select: { respuestas: true } } },
        });
    }
    async updateStatus(id, status, tenantId) {
        if (!ESTATUS.includes(status))
            throw new common_1.BadRequestException('Estatus inválido');
        const encuesta = await this.findOne(id, tenantId);
        return this.prisma.encuesta.update({
            where: { id: encuesta.id },
            data: { status: status },
            include: { _count: { select: { respuestas: true } } },
        });
    }
    async remove(id, tenantId) {
        const encuesta = await this.findOne(id, tenantId);
        await this.prisma.respuestaEncuesta.deleteMany({ where: { encuesta_id: encuesta.id } });
        await this.prisma.encuesta.delete({ where: { id: encuesta.id } });
        return { ok: true };
    }
    async createRespuesta(id, data, tenantId, userId) {
        const encuesta = await this.findOne(id, tenantId);
        if (encuesta.status !== 'activa')
            throw new common_1.BadRequestException('La encuesta no está activa');
        const respuestas = Array.isArray(data.respuestas) ? data.respuestas : [];
        const idsPreguntas = new Set((encuesta.preguntas || []).map((p) => p.id));
        for (const r of respuestas) {
            if (!idsPreguntas.has(r.pregunta_id)) {
                throw new common_1.BadRequestException(`Pregunta inválida en la respuesta: ${r.pregunta_id}`);
            }
        }
        return this.prisma.respuestaEncuesta.create({
            data: {
                tenant_id: tenantId,
                encuesta_id: encuesta.id,
                votante_id: data.votante_id || null,
                votante_nombre: data.votante_nombre ? String(data.votante_nombre).trim() : null,
                respuestas,
                coordenadas: data.coordenadas || null,
                created_by: userId || null,
            },
            include: { votante: { select: { id: true, nombre: true } } },
        });
    }
    async findRespuestas(id, query, tenantId) {
        const encuesta = await this.findOne(id, tenantId);
        return this.prisma.respuestaEncuesta.findMany({
            where: { encuesta_id: encuesta.id, tenant_id: tenantId },
            take: query.limit ? parseInt(query.limit, 10) : 500,
            orderBy: { created_at: 'desc' },
            include: { votante: { select: { id: true, nombre: true } } },
        });
    }
    async resumen(id, tenantId) {
        const encuesta = await this.findOne(id, tenantId);
        const respuestas = await this.prisma.respuestaEncuesta.findMany({
            where: { encuesta_id: encuesta.id, tenant_id: tenantId },
        });
        const preguntas = (encuesta.preguntas || []);
        const resumenPorPregunta = preguntas.map((p) => {
            const conteo = {};
            respuestas.forEach((r) => {
                const resp = (r.respuestas || []).find((x) => x.pregunta_id === p.id);
                if (!resp)
                    return;
                (resp.valores || []).forEach((v) => {
                    const k = String(v);
                    conteo[k] = (conteo[k] || 0) + 1;
                });
            });
            return { ...p, total: respuestas.length, conteo };
        });
        return {
            encuesta: { id: encuesta.id, titulo: encuesta.titulo, status: encuesta.status },
            total_respuestas: respuestas.length,
            resumen: resumenPorPregunta,
        };
    }
};
exports.EncuestasService = EncuestasService;
exports.EncuestasService = EncuestasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EncuestasService);
//# sourceMappingURL=encuestas.service.js.map