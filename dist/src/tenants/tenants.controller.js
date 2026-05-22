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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tenants_service_1 = require("./tenants.service");
const tenant_guard_1 = require("../common/guards/tenant.guard");
let TenantsController = class TenantsController {
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    async getBySlug(slug) {
        return this.tenantsService.getOrThrow(slug);
    }
    async getStats(slug) {
        const tenant = await this.tenantsService.getOrThrow(slug);
        return this.tenantsService.getStats(tenant.id);
    }
    async getLandingData(slug) {
        const tenant = await this.tenantsService.getOrThrow(slug);
        const stats = await this.tenantsService.getStats(tenant.id);
        return {
            tenant: {
                slug: tenant.slug,
                nombre_candidato: tenant.nombre_candidato,
                cargo_busca: tenant.cargo_busca,
                slogan: tenant.slogan,
            },
            stats: {
                totalSimpatizantes: stats.totalVotantes,
                totalEventos: stats.totalEventos,
            },
        };
    }
    async create(data) {
        return this.tenantsService.create(data);
    }
    async toggleVeda(id, veda_activa) {
        return this.tenantsService.toggleVeda(id, veda_activa);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Get)(':slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener tenant por slug (público)' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getBySlug", null);
__decorate([
    (0, common_1.Get)(':slug/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Estadísticas del tenant (público)' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':slug/landing'),
    (0, swagger_1.ApiOperation)({ summary: 'Datos para landing pública' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getLandingData", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nuevo tenant' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/veda'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Activar/desactivar veda electoral' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('veda_activa')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "toggleVeda", null);
exports.TenantsController = TenantsController = __decorate([
    (0, swagger_1.ApiTags)('Tenants'),
    (0, common_1.Controller)('tenants'),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map