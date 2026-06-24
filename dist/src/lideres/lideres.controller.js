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
exports.LideresController = void 0;
const common_1 = require("@nestjs/common");
const lideres_service_1 = require("./lideres.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let LideresController = class LideresController {
    constructor(lideresService) {
        this.lideresService = lideresService;
    }
    findAll(req, query) {
        const filtros = {
            padres: query.padres === 'true' ? true : undefined,
            scoreMin: query.score_min ? parseFloat(query.score_min) : undefined,
            zonaId: query.zona_id || undefined,
            sinCoordenadas: query.sin_coordenadas === 'true'
                ? true
                : query.sin_coordenadas === 'false'
                    ? false
                    : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
        };
        return this.lideresService.findAll(req.tenant.id, filtros);
    }
    findOne(id, req) {
        return this.lideresService.findOne(id, req.tenant.id);
    }
    create(data, req) {
        return this.lideresService.create(data, req.tenant.id);
    }
    update(id, data) {
        return this.lideresService.update(id, data);
    }
    remove(id) {
        return this.lideresService.delete(id);
    }
    updateScore(id, score) {
        return this.lideresService.updateScore(id, score);
    }
    stats(req) {
        return this.lideresService.getStats(req.tenant.id);
    }
    geojsonInfluencia(radio, req) {
        const radioM = Math.min(Math.max(parseInt(radio || '500', 10), 100), 5000);
        return this.lideresService.geojsonInfluencia(req.tenant.id, radioM);
    }
};
exports.LideresController = LideresController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LideresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LideresController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LideresController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LideresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LideresController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/score'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('score')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], LideresController.prototype, "updateScore", null);
__decorate([
    (0, common_1.Get)('stats/resumen'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LideresController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('geojson/influencia'),
    __param(0, (0, common_1.Query)('radio_m')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LideresController.prototype, "geojsonInfluencia", null);
exports.LideresController = LideresController = __decorate([
    (0, common_1.Controller)('lideres'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [lideres_service_1.LideresService])
], LideresController);
//# sourceMappingURL=lideres.controller.js.map