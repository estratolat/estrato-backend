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
exports.EventosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const uuid_1 = require("uuid");
let EventosService = class EventosService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, tenantId) {
        return this.prisma.evento.findMany({
            where: { tenant_id: tenantId },
            orderBy: { fecha_inicio: 'desc' },
            take: query.limit ? parseInt(query.limit) : 100,
        });
    }
    async findOne(id, tenantId) {
        const evento = await this.prisma.evento.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                asistencias: {
                    include: { votante: true },
                    orderBy: { created_at: 'desc' },
                },
            },
        });
        if (!evento) {
            throw new common_1.NotFoundException('Evento no encontrado');
        }
        return evento;
    }
    async create(data, tenantId, userId) {
        const payload = this.normalizarEvento(data, tenantId, userId);
        return this.prisma.evento.create({ data: payload });
    }
    async update(id, data, tenantId) {
        const evento = await this.findOne(id, tenantId);
        const payload = { ...data };
        delete payload.id;
        delete payload.tenant_id;
        delete payload.created_at;
        delete payload.qr_code;
        delete payload.asistencias;
        payload.tematica = payload.tematica ? String(payload.tematica).trim() : null;
        payload.zona_id = payload.zona_id || null;
        payload.lider_id = payload.lider_id || null;
        payload.generar_ficha = payload.generar_ficha === true || payload.generar_ficha === 'true';
        if (payload.generar_ficha && !payload.ficha_informativa) {
            payload.ficha_informativa = this.generarFichaInformativa(payload, tenantId);
        }
        if (payload.fecha_inicio) {
            payload.fecha_inicio = new Date(payload.fecha_inicio);
        }
        if (payload.fecha_fin) {
            payload.fecha_fin = new Date(payload.fecha_fin);
        }
        if (payload.coordenadas && typeof payload.coordenadas === 'string') {
            payload.coordenadas = JSON.parse(payload.coordenadas);
        }
        return this.prisma.evento.update({
            where: { id: evento.id },
            data: payload,
        });
    }
    async registrarAsistencia(eventoId, data, tenantId) {
        const evento = await this.findOne(eventoId, tenantId);
        if (!data.votante_id) {
            throw new common_1.BadRequestException('Se requiere votante_id');
        }
        const votante = await this.prisma.votante.findFirst({
            where: { id: data.votante_id, tenant_id: tenantId, activo: true },
        });
        if (!votante) {
            throw new common_1.BadRequestException('Votante no encontrado');
        }
        return this.prisma.asistencia.upsert({
            where: {
                evento_id_votante_id: {
                    evento_id: evento.id,
                    votante_id: data.votante_id,
                },
            },
            create: {
                evento_id: evento.id,
                votante_id: data.votante_id,
                registrado_por: data.registrado_por,
                metodo_registro: data.metodo_registro || 'manual',
                coordenadas: data.coordenadas,
            },
            update: {
                registrado_por: data.registrado_por,
                metodo_registro: data.metodo_registro || 'manual',
                coordenadas: data.coordenadas,
            },
            include: { votante: true },
        });
    }
    async eliminarAsistencia(eventoId, votanteId, tenantId) {
        await this.findOne(eventoId, tenantId);
        return this.prisma.asistencia.deleteMany({
            where: { evento_id: eventoId, votante_id: votanteId },
        });
    }
    normalizarEvento(data, tenantId, userId) {
        const payload = {
            tenant_id: tenantId,
            nombre: String(data.nombre || '').trim(),
            descripcion: data.descripcion ? String(data.descripcion).trim() : null,
            direccion: data.direccion ? String(data.direccion).trim() : null,
            fecha_inicio: new Date(data.fecha_inicio),
            qr_code: data.qr_code || this.generarQrCode(),
            status: data.status || 'programado',
            created_by: userId || null,
        };
        if (!payload.nombre) {
            throw new common_1.BadRequestException('El nombre del evento es requerido');
        }
        if (isNaN(payload.fecha_inicio.getTime())) {
            throw new common_1.BadRequestException('Fecha de inicio inválida');
        }
        if (data.fecha_fin) {
            payload.fecha_fin = new Date(data.fecha_fin);
        }
        if (data.coordenadas) {
            payload.coordenadas =
                typeof data.coordenadas === 'string' ? JSON.parse(data.coordenadas) : data.coordenadas;
        }
        if (data.asistentes_estimados) {
            payload.asistentes_estimados = parseInt(data.asistentes_estimados, 10);
        }
        payload.tematica = data.tematica ? String(data.tematica).trim() : null;
        payload.zona_id = data.zona_id || null;
        payload.lider_id = data.lider_id || null;
        payload.generar_ficha = data.generar_ficha === true || data.generar_ficha === 'true';
        if (payload.generar_ficha) {
            payload.ficha_informativa =
                data.ficha_informativa || this.generarFichaInformativa(data, tenantId);
        }
        else {
            payload.ficha_informativa = data.ficha_informativa || null;
        }
        return payload;
    }
    generarFichaInformativa(data, tenantId) {
        const fecha = data.fecha_inicio ? new Date(data.fecha_inicio).toLocaleString('es-MX') : 'Por definir';
        return `FICHA INFORMATIVA DEL EVENTO
=============================
Evento: ${data.nombre || 'Sin nombre'}
Fecha: ${fecha}
Dirección: ${data.direccion || 'Por definir'}
Temática: ${data.tematica || 'No especificada'}
Zona electoral: ${data.zona_id || 'No asignada'}
Líder principal: ${data.lider_id || 'No asignado'}
Asistentes estimados: ${data.asistentes_estimados || 'No definido'}

Esta ficha servirá para cruzar información posteriormente con votantes, apoyos y territorio.`;
    }
    generarQrCode() {
        return `evt-${(0, uuid_1.v4)().slice(0, 8)}`;
    }
};
exports.EventosService = EventosService;
exports.EventosService = EventosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventosService);
//# sourceMappingURL=eventos.service.js.map