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
exports.BoletinesController = void 0;
const common_1 = require("@nestjs/common");
const boletines_service_1 = require("./boletines.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const create_boletin_dto_1 = require("./dto/create-boletin.dto");
const generar_boletin_dto_1 = require("./dto/generar-boletin.dto");
let BoletinesController = class BoletinesController {
    constructor(boletinesService) {
        this.boletinesService = boletinesService;
    }
    findAll(req) {
        return this.boletinesService.findAll(req.tenant.id);
    }
    create(data, req) {
        return this.boletinesService.create(req.tenant.id, req.usuario.id, data);
    }
    generar(data, req) {
        return this.boletinesService.generar(req.tenant.id, req.usuario.id, data);
    }
    aprobar(id, req) {
        return this.boletinesService.aprobar(id, req.tenant.id, req.usuario.id);
    }
    rechazar(id, req) {
        return this.boletinesService.rechazar(id, req.tenant.id);
    }
};
exports.BoletinesController = BoletinesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BoletinesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_boletin_dto_1.CreateBoletinDto, Object]),
    __metadata("design:returntype", void 0)
], BoletinesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('generar'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generar_boletin_dto_1.GenerarBoletinDto, Object]),
    __metadata("design:returntype", void 0)
], BoletinesController.prototype, "generar", null);
__decorate([
    (0, common_1.Patch)(':id/aprobar'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoletinesController.prototype, "aprobar", null);
__decorate([
    (0, common_1.Patch)(':id/rechazar'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoletinesController.prototype, "rechazar", null);
exports.BoletinesController = BoletinesController = __decorate([
    (0, common_1.Controller)('boletines'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [boletines_service_1.BoletinesService])
], BoletinesController);
//# sourceMappingURL=boletines.controller.js.map