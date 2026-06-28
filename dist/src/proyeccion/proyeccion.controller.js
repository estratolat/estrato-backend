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
exports.ProyeccionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proyeccion_service_1 = require("./proyeccion.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let ProyeccionController = class ProyeccionController {
    constructor(proyeccionService) {
        this.proyeccionService = proyeccionService;
    }
    resumen(req) {
        return this.proyeccionService.resumen(req.tenant.id);
    }
    secciones(req) {
        return this.proyeccionService.porSeccion(req.tenant.id);
    }
    findMetas(query, req) {
        return this.proyeccionService.findMetas(query, req.tenant.id);
    }
    createMeta(data, req) {
        return this.proyeccionService.createMeta(data, req.tenant.id);
    }
    updateMeta(id, data, req) {
        return this.proyeccionService.updateMeta(id, data, req.tenant.id);
    }
    removeMeta(id, req) {
        return this.proyeccionService.removeMeta(id, req.tenant.id);
    }
};
exports.ProyeccionController = ProyeccionController;
__decorate([
    (0, common_1.Get)('resumen'),
    (0, swagger_1.ApiOperation)({ summary: 'Resumen global de proyección' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProyeccionController.prototype, "resumen", null);
__decorate([
    (0, common_1.Get)('secciones'),
    (0, swagger_1.ApiOperation)({ summary: 'Proyección por sección' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProyeccionController.prototype, "secciones", null);
__decorate([
    (0, common_1.Get)('metas'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar metas de votación' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProyeccionController.prototype, "findMetas", null);
__decorate([
    (0, common_1.Post)('metas'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear meta de votación' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProyeccionController.prototype, "createMeta", null);
__decorate([
    (0, common_1.Patch)('metas/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar meta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ProyeccionController.prototype, "updateMeta", null);
__decorate([
    (0, common_1.Delete)('metas/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar meta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProyeccionController.prototype, "removeMeta", null);
exports.ProyeccionController = ProyeccionController = __decorate([
    (0, swagger_1.ApiTags)('Proyección'),
    (0, common_1.Controller)('proyeccion'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [proyeccion_service_1.ProyeccionService])
], ProyeccionController);
//# sourceMappingURL=proyeccion.controller.js.map