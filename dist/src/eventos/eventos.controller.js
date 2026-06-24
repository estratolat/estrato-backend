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
exports.EventosController = void 0;
const common_1 = require("@nestjs/common");
const eventos_service_1 = require("./eventos.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let EventosController = class EventosController {
    constructor(eventosService) {
        this.eventosService = eventosService;
    }
    findAll(query, req) {
        return this.eventosService.findAll(query, req.tenant.id);
    }
    findOne(id, req) {
        return this.eventosService.findOne(id, req.tenant.id);
    }
    create(data, req) {
        return this.eventosService.create(data, req.tenant.id, req.usuario?.id);
    }
    update(id, data, req) {
        return this.eventosService.update(id, data, req.tenant.id);
    }
    registrarAsistencia(eventoId, data, req) {
        return this.eventosService.registrarAsistencia(eventoId, data, req.tenant.id);
    }
    eliminarAsistencia(eventoId, votanteId, req) {
        return this.eventosService.eliminarAsistencia(eventoId, votanteId, req.tenant.id);
    }
};
exports.EventosController = EventosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EventosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EventosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EventosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], EventosController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/asistencias'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], EventosController.prototype, "registrarAsistencia", null);
__decorate([
    (0, common_1.Delete)(':id/asistencias/:votanteId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('votanteId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], EventosController.prototype, "eliminarAsistencia", null);
exports.EventosController = EventosController = __decorate([
    (0, common_1.Controller)('eventos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [eventos_service_1.EventosService])
], EventosController);
//# sourceMappingURL=eventos.controller.js.map