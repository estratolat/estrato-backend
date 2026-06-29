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
exports.CandidatoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const anthropic_service_1 = require("../common/services/anthropic.service");
const transcripcion_service_1 = require("../common/services/transcripcion.service");
let CandidatoService = class CandidatoService {
    constructor(prisma, anthropic, transcripcion) {
        this.prisma = prisma;
        this.anthropic = anthropic;
        this.transcripcion = transcripcion;
    }
    async getPerfil(tenantId) {
        const perfil = await this.prisma.perfilCandidato.findUnique({
            where: { tenant_id: tenantId },
        });
        if (!perfil) {
            return null;
        }
        return perfil;
    }
    async upsertPerfil(tenantId, data) {
        const existente = await this.prisma.perfilCandidato.findUnique({
            where: { tenant_id: tenantId },
        });
        const payload = {};
        if (data.nombre !== undefined)
            payload.nombre = data.nombre;
        if (data.biografia !== undefined)
            payload.biografia = data.biografia;
        if (data.gustos !== undefined)
            payload.gustos = data.gustos;
        if (data.discurso !== undefined)
            payload.discurso = data.discurso;
        if (data.video_url !== undefined)
            payload.video_url = data.video_url;
        if (data.video_transcripcion !== undefined)
            payload.video_transcripcion = data.video_transcripcion;
        if (existente) {
            return this.prisma.perfilCandidato.update({
                where: { tenant_id: tenantId },
                data: payload,
            });
        }
        return this.prisma.perfilCandidato.create({
            data: {
                tenant_id: tenantId,
                ...payload,
            },
        });
    }
    async analizar(tenantId, transcribirVideo = false) {
        const perfil = await this.prisma.perfilCandidato.findUnique({
            where: { tenant_id: tenantId },
        });
        if (!perfil) {
            throw new common_1.NotFoundException('No existe perfil de candidato para este tenant');
        }
        let transcripcion = perfil.video_transcripcion || '';
        if (transcribirVideo && perfil.video_url) {
            transcripcion = await this.transcripcion.transcribirVideo(perfil.video_url);
            await this.prisma.perfilCandidato.update({
                where: { tenant_id: tenantId },
                data: { video_transcripcion: transcripcion },
            });
        }
        const huella = await this.anthropic.analizarCandidato(perfil.discurso || '', transcripcion || '');
        const updated = await this.prisma.perfilCandidato.update({
            where: { tenant_id: tenantId },
            data: {
                palabras_clave: huella.palabras_clave,
                muletillas: huella.muletillas,
                frases_recurrentes: huella.frases_recurrentes,
                llamados_accion: huella.llamados_accion,
                tono: huella.tono,
                propuesta_central: huella.propuesta_central,
                estilo_redes: huella.estilo_redes,
                metadata: { ...(perfil.metadata || {}), ...huella },
                analizado_en: new Date(),
            },
        });
        return updated;
    }
    async generarContenido(tenantId, tipo, contexto) {
        const perfil = await this.prisma.perfilCandidato.findUnique({
            where: { tenant_id: tenantId },
        });
        if (!perfil) {
            throw new common_1.NotFoundException('No existe perfil de candidato para este tenant');
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
        return this.anthropic.generarConHuella(huella, {
            perfil: {
                nombre: perfil.nombre || undefined,
                biografia: perfil.biografia || undefined,
                gustos: perfil.gustos || undefined,
                propuesta_central: perfil.propuesta_central || undefined,
            },
            tipo,
            contexto,
        });
    }
};
exports.CandidatoService = CandidatoService;
exports.CandidatoService = CandidatoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        anthropic_service_1.AnthropicService,
        transcripcion_service_1.TranscripcionService])
], CandidatoService);
//# sourceMappingURL=candidato.service.js.map