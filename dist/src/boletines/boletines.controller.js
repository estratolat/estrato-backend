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
let BoletinesController = class BoletinesController {
    constructor(boletinesService) {
        this.boletinesService = boletinesService;
    }
    findAll() {
        return this.boletinesService.findAll();
    }
    create(data) {
        return this.boletinesService.create(data);
    }
    aprobar(id) {
        return this.boletinesService.aprobar(id);
    }
    rechazar(id) {
        return this.boletinesService.rechazar(id);
    }
};
exports.BoletinesController = BoletinesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BoletinesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BoletinesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/aprobar'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BoletinesController.prototype, "aprobar", null);
__decorate([
    (0, common_1.Patch)(':id/rechazar'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BoletinesController.prototype, "rechazar", null);
exports.BoletinesController = BoletinesController = __decorate([
    (0, common_1.Controller)('boletines'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [boletines_service_1.BoletinesService])
], BoletinesController);
//# sourceMappingURL=boletines.controller.js.map