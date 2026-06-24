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
exports.LlamadasController = void 0;
const common_1 = require("@nestjs/common");
const llamadas_service_1 = require("./llamadas.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const create_campana_dto_1 = require("./dto/create-campana.dto");
const update_campana_dto_1 = require("./dto/update-campana.dto");
const importar_votantes_dto_1 = require("./dto/importar-votantes.dto");
const iniciar_llamada_dto_1 = require("./dto/iniciar-llamada.dto");
const swagger_1 = require("@nestjs/swagger");
let LlamadasController = class LlamadasController {
    constructor(llamadasService) {
        this.llamadasService = llamadasService;
    }
    tenantId(req) {
        return req.user?.tenant_id || req.headers['x-tenant-id'];
    }
    async getCampanas(req) {
        return this.llamadasService.findAll(this.tenantId(req));
    }
    async createCampana(dto, req) {
        return this.llamadasService.create(this.tenantId(req), req.user.userId, dto);
    }
    async getCampana(id, req) {
        return this.llamadasService.findOne(id, this.tenantId(req));
    }
    async updateCampana(id, dto, req) {
        return this.llamadasService.update(id, this.tenantId(req), dto);
    }
    async deleteCampana(id, req) {
        return this.llamadasService.remove(id, this.tenantId(req));
    }
    async importarVotantes(id, dto, req) {
        return this.llamadasService.importarVotantes(id, this.tenantId(req), dto.votante_ids);
    }
    async iniciarLlamada(id, dto, req) {
        return this.llamadasService.iniciarLlamada(id, dto.votante_id, this.tenantId(req));
    }
    async getLlamadas(id, req) {
        return this.llamadasService.getLlamadas(id, this.tenantId(req));
    }
    async webhook(payload, headers) {
        return this.llamadasService.procesarWebhook(payload);
    }
};
exports.LlamadasController = LlamadasController;
__decorate([
    (0, common_1.Get)('campanas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar campañas de llamadas automáticas' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LlamadasController.prototype, "getCampanas", null);
__decorate([
    (0, common_1.Post)('campanas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear campaña de llamadas' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_campana_dto_1.CreateCampanaDto, Object]),
    __metadata("design:returntype", Promise)
], LlamadasController.prototype, "createCampana", null);
__decorate([
    (0, common_1.Get)('campanas/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener campaña con llamadas' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LlamadasController.prototype, "getCampana", null);
__decorate([
    (0, common_1.Patch)('campanas/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar campaña de llamadas' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_campana_dto_1.UpdateCampanaDto, Object]),
    __metadata("design:returntype", Promise)
], LlamadasController.prototype, "updateCampana", null);
__decorate([
    (0, common_1.Delete)('campanas/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar campaña de llamadas' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LlamadasController.prototype, "deleteCampana", null);
__decorate([
    (0, common_1.Post)('campanas/:id/importar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Importar votantes a la campaña' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, importar_votantes_dto_1.ImportarVotantesDto, Object]),
    __metadata("design:returntype", Promise)
], LlamadasController.prototype, "importarVotantes", null);
__decorate([
    (0, common_1.Post)('campanas/:id/llamadas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Iniciar llamada a un votante' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, iniciar_llamada_dto_1.IniciarLlamadaDto, Object]),
    __metadata("design:returntype", Promise)
], LlamadasController.prototype, "iniciarLlamada", null);
__decorate([
    (0, common_1.Get)('campanas/:id/llamadas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar llamadas de la campaña' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LlamadasController.prototype, "getLlamadas", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook para eventos del proveedor de llamadas' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LlamadasController.prototype, "webhook", null);
exports.LlamadasController = LlamadasController = __decorate([
    (0, swagger_1.ApiTags)('Llamadas'),
    (0, common_1.Controller)('llamadas'),
    __metadata("design:paramtypes", [llamadas_service_1.LlamadasService])
], LlamadasController);
//# sourceMappingURL=llamadas.controller.js.map