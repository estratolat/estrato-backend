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
exports.CasillasController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const casillas_service_1 = require("./casillas.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let CasillasController = class CasillasController {
    constructor(casillasService) {
        this.casillasService = casillasService;
    }
    findAll(query, req) {
        return this.casillasService.findAll(query, req.tenant.id);
    }
    findOne(id, req) {
        return this.casillasService.findOne(id, req.tenant.id);
    }
    create(data, req) {
        return this.casillasService.create(data, req.tenant.id);
    }
    update(id, data, req) {
        return this.casillasService.update(id, data, req.tenant.id);
    }
    updateStatus(id, status, incidencia, req) {
        return this.casillasService.updateStatus(id, status, incidencia, req.tenant.id);
    }
    remove(id, req) {
        return this.casillasService.remove(id, req.tenant.id);
    }
    importar(body, req) {
        return this.casillasService.importar(body.casillas || [], req.tenant.id);
    }
};
exports.CasillasController = CasillasController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar casillas del tenant' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CasillasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Ver casilla' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CasillasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear casilla' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CasillasController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar casilla' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CasillasController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/estatus'),
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar estatus de casilla' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('incidencia')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], CasillasController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar casilla' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CasillasController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('importar'),
    (0, swagger_1.ApiOperation)({ summary: 'Importar casillas masivamente' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CasillasController.prototype, "importar", null);
exports.CasillasController = CasillasController = __decorate([
    (0, swagger_1.ApiTags)('Casillas'),
    (0, common_1.Controller)('casillas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [casillas_service_1.CasillasService])
], CasillasController);
//# sourceMappingURL=casillas.controller.js.map