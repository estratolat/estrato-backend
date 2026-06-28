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
exports.FichasSeccionalesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fichas_seccionales_service_1 = require("./fichas-seccionales.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let FichasSeccionalesController = class FichasSeccionalesController {
    constructor(fichasService) {
        this.fichasService = fichasService;
    }
    secciones(req) {
        return this.fichasService.secciones(req.tenant.id);
    }
    ficha(seccion, req) {
        return this.fichasService.ficha(seccion, req.tenant.id);
    }
    comparativa(secciones, req) {
        return this.fichasService.comparativa(secciones, req.tenant.id);
    }
};
exports.FichasSeccionalesController = FichasSeccionalesController;
__decorate([
    (0, common_1.Get)('secciones'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar secciones con votantes' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FichasSeccionalesController.prototype, "secciones", null);
__decorate([
    (0, common_1.Get)(':seccion'),
    (0, swagger_1.ApiOperation)({ summary: 'Ficha completa de una sección' }),
    __param(0, (0, common_1.Param)('seccion')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FichasSeccionalesController.prototype, "ficha", null);
__decorate([
    (0, common_1.Post)('comparativa'),
    (0, swagger_1.ApiOperation)({ summary: 'Comparar varias secciones' }),
    __param(0, (0, common_1.Body)('secciones')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], FichasSeccionalesController.prototype, "comparativa", null);
exports.FichasSeccionalesController = FichasSeccionalesController = __decorate([
    (0, swagger_1.ApiTags)('Fichas Seccionales'),
    (0, common_1.Controller)('fichas-seccionales'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [fichas_seccionales_service_1.FichasSeccionalesService])
], FichasSeccionalesController);
//# sourceMappingURL=fichas-seccionales.controller.js.map