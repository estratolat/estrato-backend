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
exports.MonitoreoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const monitoreo_service_1 = require("./monitoreo.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let MonitoreoController = class MonitoreoController {
    constructor(monitoreoService) {
        this.monitoreoService = monitoreoService;
    }
    resumen(req) {
        return this.monitoreoService.resumen(req.tenant.id);
    }
    porSeccion(req) {
        return this.monitoreoService.porSeccion(req.tenant.id);
    }
    casillas(query, req) {
        return this.monitoreoService.casillas(query, req.tenant.id);
    }
    incidencias(req) {
        return this.monitoreoService.incidencias(req.tenant.id);
    }
};
exports.MonitoreoController = MonitoreoController;
__decorate([
    (0, common_1.Get)('resumen'),
    (0, swagger_1.ApiOperation)({ summary: 'Resumen de casillas reportadas' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MonitoreoController.prototype, "resumen", null);
__decorate([
    (0, common_1.Get)('por-seccion'),
    (0, swagger_1.ApiOperation)({ summary: 'Casillas agrupadas por sección' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MonitoreoController.prototype, "porSeccion", null);
__decorate([
    (0, common_1.Get)('casillas'),
    (0, swagger_1.ApiOperation)({ summary: 'Listado de casillas para monitoreo' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MonitoreoController.prototype, "casillas", null);
__decorate([
    (0, common_1.Get)('incidencias'),
    (0, swagger_1.ApiOperation)({ summary: 'Casillas con incidencias' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MonitoreoController.prototype, "incidencias", null);
exports.MonitoreoController = MonitoreoController = __decorate([
    (0, swagger_1.ApiTags)('Monitoreo'),
    (0, common_1.Controller)('monitoreo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [monitoreo_service_1.MonitoreoService])
], MonitoreoController);
//# sourceMappingURL=monitoreo.controller.js.map