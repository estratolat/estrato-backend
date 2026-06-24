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
exports.VotantesController = void 0;
const common_1 = require("@nestjs/common");
const votantes_service_1 = require("./votantes.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let VotantesController = class VotantesController {
    constructor(votantesService) {
        this.votantesService = votantesService;
    }
    async findAll(query, req) {
        try {
            return await this.votantesService.findAll(query, req.tenant.id);
        }
        catch (err) {
            console.error('[VotantesController.findAll] ERROR:', err?.message, err?.stack);
            throw err;
        }
    }
    async getStats(req) {
        try {
            return await this.votantesService.getStats(req.tenant.id);
        }
        catch (err) {
            console.error('[VotantesController.getStats] ERROR:', err?.message, err?.stack);
            throw err;
        }
    }
    findOne(id) {
        return this.votantesService.findOne(id);
    }
    create(data, req) {
        return this.votantesService.create(data, req.tenant.id);
    }
    importar(body, req) {
        return this.votantesService.importar(body.votantes || [], req.tenant.id);
    }
    update(id, data) {
        return this.votantesService.update(id, data);
    }
};
exports.VotantesController = VotantesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VotantesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VotantesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VotantesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VotantesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('importar'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VotantesController.prototype, "importar", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VotantesController.prototype, "update", null);
exports.VotantesController = VotantesController = __decorate([
    (0, common_1.Controller)('votantes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [votantes_service_1.VotantesService])
], VotantesController);
//# sourceMappingURL=votantes.controller.js.map