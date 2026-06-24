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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const candidato_service_1 = require("./candidato.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const update_perfil_dto_1 = require("./dto/update-perfil.dto");
const analizar_dto_1 = require("./dto/analizar.dto");
const generar_contenido_dto_1 = require("./dto/generar-contenido.dto");
let CandidatoController = class CandidatoController {
    constructor(candidatoService) {
        this.candidatoService = candidatoService;
    }
    getPerfil(req) {
        return this.candidatoService.getPerfil(req.tenant.id);
    }
    upsertPerfil(data, req) {
        return this.candidatoService.upsertPerfil(req.tenant.id, data);
    }
    async analizar(body, req) {
        return this.candidatoService.analizar(req.tenant.id, body.transcribir_video);
    }
    generar(data, req) {
        return this.candidatoService.generarContenido(req.tenant.id, data.tipo, {
            tema: data.tema,
            que: data.que,
            quien: data.quien,
            como: data.como,
            cuando: data.cuando,
            donde: data.donde,
            por_que: data.por_que,
            para_que: data.para_que,
        });
    }
};
exports.CandidatoController = CandidatoController;
__decorate([
    (0, common_1.Get)('perfil'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener perfil del candidato del tenant' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CandidatoController.prototype, "getPerfil", null);
__decorate([
    (0, common_1.Post)('perfil'),
    (0, roles_guard_1.Roles)('owner', 'candidato', 'cm'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear o actualizar perfil del candidato' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_perfil_dto_1.UpdatePerfilDto, Object]),
    __metadata("design:returntype", void 0)
], CandidatoController.prototype, "upsertPerfil", null);
__decorate([
    (0, common_1.Post)('perfil/analizar'),
    (0, roles_guard_1.Roles)('owner', 'candidato', 'cm'),
    (0, swagger_1.ApiOperation)({ summary: 'Analizar discurso y transcripción con Anthropic' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analizar_dto_1.AnalizarDto, Object]),
    __metadata("design:returntype", Promise)
], CandidatoController.prototype, "analizar", null);
__decorate([
    (0, common_1.Post)('generar'),
    (0, roles_guard_1.Roles)('owner', 'candidato', 'cm'),
    (0, swagger_1.ApiOperation)({ summary: 'Generar boletín o caption con la voz del candidato' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generar_contenido_dto_1.GenerarContenidoDto, Object]),
    __metadata("design:returntype", void 0)
], CandidatoController.prototype, "generar", null);
exports.CandidatoController = CandidatoController = __decorate([
    (0, swagger_1.ApiTags)('Candidato'),
    (0, common_1.Controller)('candidato'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [candidato_service_1.CandidatoService])
], CandidatoController);
//# sourceMappingURL=candidato.controller.js.map