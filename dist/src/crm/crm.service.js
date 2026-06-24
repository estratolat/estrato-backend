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
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const messaging_service_1 = require("./messaging.service");
let CrmService = class CrmService {
    constructor(prisma, messaging) {
        this.prisma = prisma;
        this.messaging = messaging;
    }
    async getConversaciones(tenantId, filters) {
        const where = { tenant_id: tenantId };
        if (filters.canal)
            where.canal = filters.canal;
        if (filters.direccion)
            where.direccion = filters.direccion;
        if (filters.search) {
            const term = String(filters.search).toLowerCase();
            where.votante = {
                OR: [
                    { nombre: { contains: term, mode: 'insensitive' } },
                    { telefono: { contains: term, mode: 'insensitive' } },
                ],
            };
        }
        const mensajes = await this.prisma.mensaje.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 1000,
            include: {
                votante: {
                    select: {
                        id: true,
                        nombre: true,
                        telefono: true,
                        email: true,
                        colonia: true,
                        municipio: true,
                        nivel_apoyo: true,
                        metadata: true,
                    },
                },
            },
        });
        const vistos = new Set();
        const conversaciones = [];
        for (const m of mensajes) {
            if (vistos.has(m.votante_id))
                continue;
            vistos.add(m.votante_id);
            conversaciones.push({
                votante_id: m.votante_id,
                votante: m.votante,
                ultimo_mensaje: {
                    id: m.id,
                    canal: m.canal,
                    direccion: m.direccion,
                    contenido: m.contenido,
                    leido: m.leido,
                    created_at: m.created_at,
                },
            });
            if (conversaciones.length >= (filters.limit || 50))
                break;
        }
        const votanteIds = conversaciones.map((c) => c.votante_id);
        const noLeidos = await this.prisma.mensaje.groupBy({
            by: ['votante_id'],
            where: {
                tenant_id: tenantId,
                votante_id: { in: votanteIds },
                leido: false,
                direccion: 'inbound',
            },
            _count: { id: true },
        });
        const conteoNoLeidos = Object.fromEntries(noLeidos.map((n) => [n.votante_id, n._count.id]));
        return conversaciones.map((c) => ({
            ...c,
            no_leidos: conteoNoLeidos[c.votante_id] || 0,
        }));
    }
    async getMensajes(tenantId, filters) {
        const where = { tenant_id: tenantId };
        if (filters.votante_id)
            where.votante_id = filters.votante_id;
        if (filters.canal)
            where.canal = filters.canal;
        if (filters.direccion)
            where.direccion = filters.direccion;
        return this.prisma.mensaje.findMany({
            where,
            take: filters.limit,
            orderBy: { created_at: 'asc' },
            include: {
                votante: {
                    select: {
                        id: true,
                        nombre: true,
                        telefono: true,
                        email: true,
                        colonia: true,
                        metadata: true,
                    },
                },
                atendedor: { select: { id: true, nombre: true } },
            },
        });
    }
    async enviarMensaje(tenantId, userId, data) {
        const votante = await this.prisma.votante.findFirst({
            where: { id: data.votante_id, tenant_id: tenantId },
        });
        if (!votante) {
            throw new common_1.NotFoundException('Votante no encontrado');
        }
        const canal = data.canal;
        let destinatarioId;
        if (canal === 'whatsapp') {
            destinatarioId = votante.telefono || undefined;
        }
        else if (canal === 'messenger') {
            destinatarioId = votante.metadata?.messenger_id || undefined;
        }
        else if (canal === 'instagram') {
            destinatarioId = votante.metadata?.instagram_id || undefined;
        }
        let envioExterno = { ok: true };
        if (destinatarioId &&
            (canal === 'whatsapp' || canal === 'messenger' || canal === 'instagram')) {
            envioExterno = await this.messaging.enviarOutbound(canal, destinatarioId, data.contenido);
        }
        const mensaje = await this.prisma.mensaje.create({
            data: {
                tenant_id: tenantId,
                votante_id: data.votante_id,
                canal,
                direccion: 'outbound',
                contenido: data.contenido,
                template_usado: data.template_usado || null,
                atendido_por: userId,
                leido: true,
                metadata: envioExterno.ok ? { envioExterno } : { envioExterno, error: envioExterno.error },
            },
            include: {
                votante: { select: { id: true, nombre: true, telefono: true } },
                atendedor: { select: { id: true, nombre: true } },
            },
        });
        await this.prisma.votante.update({
            where: { id: data.votante_id },
            data: { ultimo_contacto: new Date() },
        });
        return mensaje;
    }
    async marcarLeido(id, tenantId, userId) {
        const existe = await this.prisma.mensaje.findFirst({
            where: { id, tenant_id: tenantId, direccion: 'inbound' },
        });
        if (!existe) {
            throw new common_1.NotFoundException('Mensaje no encontrado');
        }
        return this.prisma.mensaje.update({
            where: { id },
            data: {
                leido: true,
                atendido_por: userId || existe.atendido_por,
            },
            include: {
                votante: { select: { id: true, nombre: true, telefono: true } },
                atendedor: { select: { id: true, nombre: true } },
            },
        });
    }
    async procesarWebhook(tenantId, payload) {
        const mensajesExternos = this.messaging.parseWebhook(payload);
        const guardados = [];
        for (const externo of mensajesExternos) {
            const votante = await this.obtenerOCrearVotanteDesdeExterno(tenantId, externo);
            const existe = await this.prisma.mensaje.findFirst({
                where: {
                    tenant_id: tenantId,
                    id_externo: externo.id_externo,
                    canal: externo.canal,
                },
            });
            if (existe)
                continue;
            const mensaje = await this.prisma.mensaje.create({
                data: {
                    tenant_id: tenantId,
                    votante_id: votante.id,
                    canal: externo.canal,
                    direccion: 'inbound',
                    contenido: externo.contenido,
                    id_externo: externo.id_externo,
                    metadata: externo.metadata || {},
                    leido: false,
                },
                include: {
                    votante: { select: { id: true, nombre: true, telefono: true } },
                },
            });
            await this.prisma.votante.update({
                where: { id: votante.id },
                data: { ultimo_contacto: new Date() },
            });
            guardados.push(mensaje);
        }
        return { recibidos: mensajesExternos.length, guardados: guardados.length };
    }
    async obtenerOCrearVotanteDesdeExterno(tenantId, externo) {
        let votante = null;
        if (externo.canal === 'whatsapp' && externo.remitente_id) {
            const telefono = this.normalizarTelefono(externo.remitente_id);
            votante = await this.prisma.votante.findFirst({
                where: {
                    tenant_id: tenantId,
                    telefono: { contains: telefono.replace('+', ''), mode: 'insensitive' },
                },
            });
            if (!votante) {
                votante = await this.prisma.votante.create({
                    data: {
                        tenant_id: tenantId,
                        nombre: externo.remitente_nombre || 'Usuario WhatsApp',
                        telefono: telefono,
                        telefono_hash: this.hashSimple(telefono),
                        origen_qr: 'whatsapp',
                        nivel_apoyo: 3,
                        activo: true,
                    },
                });
            }
        }
        else if (externo.canal === 'messenger' && externo.remitente_id) {
            votante = await this.buscarVotantePorMetadata(tenantId, 'messenger_id', externo.remitente_id);
            if (!votante) {
                votante = await this.prisma.votante.create({
                    data: {
                        tenant_id: tenantId,
                        nombre: 'Usuario Messenger',
                        origen_qr: 'messenger',
                        nivel_apoyo: 3,
                        activo: true,
                        metadata: { messenger_id: externo.remitente_id },
                    },
                });
            }
        }
        else if (externo.canal === 'instagram' && externo.remitente_id) {
            votante = await this.buscarVotantePorMetadata(tenantId, 'instagram_id', externo.remitente_id);
            if (!votante) {
                votante = await this.prisma.votante.create({
                    data: {
                        tenant_id: tenantId,
                        nombre: 'Usuario Instagram',
                        origen_qr: 'instagram',
                        nivel_apoyo: 3,
                        activo: true,
                        metadata: { instagram_id: externo.remitente_id },
                    },
                });
            }
        }
        if (!votante) {
            throw new Error('No se pudo identificar el remitente del mensaje');
        }
        return votante;
    }
    async buscarVotantePorMetadata(tenantId, key, value) {
        const rows = await this.prisma.$queryRaw `
      SELECT id FROM votantes
      WHERE tenant_id = ${tenantId}::uuid
        AND metadata ->> ${key} = ${value}
      LIMIT 1
    `;
        if (!rows || rows.length === 0)
            return null;
        return this.prisma.votante.findUnique({ where: { id: rows[0].id } });
    }
    async getStats(tenantId) {
        const where = { tenant_id: tenantId };
        const [total, pendientes, porCanal] = await Promise.all([
            this.prisma.mensaje.count({ where }),
            this.prisma.mensaje.count({ where: { ...where, leido: false, direccion: 'inbound' } }),
            this.prisma.mensaje.groupBy({
                by: ['canal', 'direccion'],
                where,
                _count: { id: true },
            }),
        ]);
        return { total, pendientes, porCanal };
    }
    normalizarTelefono(value) {
        const digits = String(value).replace(/\D/g, '');
        if (digits.startsWith('52') && digits.length >= 12)
            return `+${digits}`;
        if (digits.length === 10)
            return `+52${digits}`;
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
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService])
], CrmService);
//# sourceMappingURL=crm.service.js.map