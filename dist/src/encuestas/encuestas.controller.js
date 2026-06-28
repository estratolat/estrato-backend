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
exports.EncuestasController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const encuestas_service_1 = require("./encuestas.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let EncuestasController = class EncuestasController {
    constructor(encuestasService) {
        this.encuestasService = encuestasService;
    }
    findAll(query, req) {
        return this.encuestasService.findAll(query, req.tenant.id);
    }
    findOne(id, req) {
        return this.encuestasService.findOne(id, req.tenant.id);
    }
    create(data, req) {
        return this.encuestasService.create(data, req.tenant.id, req.usuario?.id);
    }
    update(id, data, req) {
        return this.encuestasService.update(id, data, req.tenant.id);
    }
    updateStatus(id, status, req) {
        return this.encuestasService.updateStatus(id, status, req.tenant.id);
    }
    remove(id, req) {
        return this.encuestasService.remove(id, req.tenant.id);
    }
    createRespuesta(id, data, req) {
        return this.encuestasService.createRespuesta(id, data, req.tenant.id, req.usuario?.id);
    }
    findRespuestas(id, query, req) {
        return this.encuestasService.findRespuestas(id, query, req.tenant.id);
    }
    resumen(id, req) {
        return this.encuestasService.resumen(id, req.tenant.id);
    }
};
exports.EncuestasController = EncuestasController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar encuestas del tenant' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Ver detalle de una encuesta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear encuesta' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar encuesta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/estatus'),
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar estatus de encuesta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar encuesta y sus respuestas' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/respuestas'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar respuesta a una encuesta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "createRespuesta", null);
__decorate([
    (0, common_1.Get)(':id/respuestas'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar respuestas de una encuesta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "findRespuestas", null);
__decorate([
    (0, common_1.Get)(':id/resumen'),
    (0, swagger_1.ApiOperation)({ summary: 'Resumen agregado de respuestas' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EncuestasController.prototype, "resumen", null);
exports.EncuestasController = EncuestasController = __decorate([
    (0, swagger_1.ApiTags)('Encuestas'),
    (0, common_1.Controller)('encuestas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [encuestas_service_1.EncuestasService])
], EncuestasController);
//# sourceMappingURL=encuestas.controller.js.map