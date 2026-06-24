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
exports.BoletinesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const anthropic_service_1 = require("../common/services/anthropic.service");
let BoletinesService = class BoletinesService {
    constructor(prisma, anthropic) {
        this.prisma = prisma;
        this.anthropic = anthropic;
    }
    async findAll(tenantId) {
        return this.prisma.boletin.findMany({
            where: { tenant_id: tenantId },
            orderBy: { created_at: 'desc' },
            include: {
                creador: { select: { id: true, nombre: true, email: true } },
                aprobador: { select: { id: true, nombre: true } },
            },
        });
    }
    async create(tenantId, userId, data) {
        return this.prisma.boletin.create({
            data: {
                tenant_id: tenantId,
                created_by: userId,
                prompt_usuario: data.prompt_usuario,
                titulo: data.titulo ?? null,
                bajada: data.bajada ?? null,
                desarrollo: data.desarrollo ?? null,
                copy_generado: data.copy_generado ?? null,
                caption_redes: data.caption_redes ?? null,
                imagen_url: data.imagen_url ?? null,
                aprobado: data.aprobado ?? false,
            },
            include: {
                creador: { select: { id: true, nombre: true, email: true } },
            },
        });
    }
    async generar(tenantId, userId, dto) {
        const perfil = await this.prisma.perfilCandidato.findUnique({
            where: { tenant_id: tenantId },
        });
        if (!perfil) {
            throw new common_1.NotFoundException('No existe perfil de candidato para esta campaña');
        }
        const huella = {
            palabras_clave: perfil.palabras_clave || [],
            muletillas: perfil.muletillas || [],
            frases_recurrentes: perfil.frases_recurrentes || [],
            llamados_accion: perfil.llamados_accion || [],
            tono: perfil.tono || '',
            propuesta_central: perfil.propuesta_central || '',
            estilo_redes: perfil.estilo_redes || '',
        };
        const contexto = {
            tema: dto.tema,
            que: dto.que,
            quien: dto.quien,
            como: dto.como,
            cuando: dto.cuando,
            donde: dto.donde,
            por_que: dto.por_que,
            para_que: dto.para_que,
        };
        const generado = await this.anthropic.generarConHuella(huella, {
            perfil: {
                nombre: perfil.nombre || undefined,
                biografia: perfil.biografia || undefined,
                gustos: perfil.gustos || undefined,
                propuesta_central: perfil.propuesta_central || undefined,
            },
            tipo: dto.tipo,
            contexto,
        });
        const promptUsuario = JSON.stringify({ tipo: dto.tipo, ...contexto });
        const boletin = await this.prisma.boletin.create({
            data: {
                tenant_id: tenantId,
                created_by: userId,
                prompt_usuario: promptUsuario,
                titulo: dto.tipo === 'redes' ? null : generado.titulo ?? null,
                bajada: dto.tipo === 'redes' ? null : generado.bajada ?? null,
                desarrollo: dto.tipo === 'redes' ? null : generado.desarrollo ?? null,
                copy_generado: dto.tipo === 'redes' ? null : generado.texto ?? null,
                caption_redes: dto.tipo === 'redes' ? generado.caption ?? null : null,
                versiones_redes: dto.tipo === 'redes' && Array.isArray(generado.versiones_redes) && generado.versiones_redes.length > 0
                    ? generado.versiones_redes
                    : null,
                imagen_url: null,
                aprobado: false,
            },
            include: {
                creador: { select: { id: true, nombre: true, email: true } },
            },
        });
        return {
            ...generado,
            boletin,
        };
    }
    async aprobar(id, tenantId, userId) {
        const existe = await this.prisma.boletin.findFirst({
            where: { id, tenant_id: tenantId },
        });
        if (!existe) {
            throw new common_1.NotFoundException('Boletín no encontrado');
        }
        return this.prisma.boletin.update({
            where: { id },
            data: { aprobado: true, aprobado_por: userId },
            include: {
                creador: { select: { id: true, nombre: true } },
                aprobador: { select: { id: true, nombre: true } },
            },
        });
    }
    async rechazar(id, tenantId) {
        const existe = await this.prisma.boletin.findFirst({
            where: { id, tenant_id: tenantId },
        });
        if (!existe) {
            throw new common_1.NotFoundException('Boletín no encontrado');
        }
        return this.prisma.boletin.update({
            where: { id },
            data: { aprobado: false, aprobado_por: null },
            include: {
                creador: { select: { id: true, nombre: true } },
            },
        });
    }
};
exports.BoletinesService = BoletinesService;
exports.BoletinesService = BoletinesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        anthropic_service_1.AnthropicService])
], BoletinesService);
//# sourceMappingURL=boletines.service.js.map