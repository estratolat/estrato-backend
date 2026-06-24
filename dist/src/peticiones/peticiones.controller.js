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
exports.PeticionesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const peticiones_service_1 = require("./peticiones.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let PeticionesController = class PeticionesController {
    constructor(peticionesService) {
        this.peticionesService = peticionesService;
    }
    findAll(query, req) {
        return this.peticionesService.findAll(query, req.tenant.id);
    }
    create(data, req) {
        return this.peticionesService.create(data, req.tenant.id, req.usuario?.id);
    }
    updateEstatus(id, estatus, req) {
        return this.peticionesService.updateEstatus(id, estatus, req.tenant.id);
    }
};
exports.PeticionesController = PeticionesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar peticiones ciudadanas del tenant' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PeticionesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nueva petición ciudadana' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PeticionesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/estatus'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar estatus de una petición' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('estatus')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PeticionesController.prototype, "updateEstatus", null);
exports.PeticionesController = PeticionesController = __decorate([
    (0, swagger_1.ApiTags)('Peticiones'),
    (0, common_1.Controller)('peticiones'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [peticiones_service_1.PeticionesService])
], PeticionesController);
//# sourceMappingURL=peticiones.controller.js.map