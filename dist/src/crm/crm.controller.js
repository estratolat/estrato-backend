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
exports.CrmController = void 0;
const common_1 = require("@nestjs/common");
const crm_service_1 = require("./crm.service");
const messaging_service_1 = require("./messaging.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const prisma_service_1 = require("../common/services/prisma.service");
const create_mensaje_dto_1 = require("./dto/create-mensaje.dto");
const filters_mensajes_dto_1 = require("./dto/filters-mensajes.dto");
let CrmController = class CrmController {
    constructor(crmService, messagingService, prisma) {
        this.crmService = crmService;
        this.messagingService = messagingService;
        this.prisma = prisma;
    }
    getConversaciones(filters, req) {
        return this.crmService.getConversaciones(req.tenant.id, filters);
    }
    getMensajes(filters, req) {
        return this.crmService.getMensajes(req.tenant.id, filters);
    }
    enviarMensaje(data, req) {
        return this.crmService.enviarMensaje(req.tenant.id, req.usuario.id, data);
    }
    marcarLeido(id, req) {
        return this.crmService.marcarLeido(id, req.tenant.id, req.usuario.id);
    }
    getStats(req) {
        return this.crmService.getStats(req.tenant.id);
    }
    async recibirWebhook(tenantSlug, payload) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug: tenantSlug },
        });
        if (!tenant) {
            throw new common_1.ForbiddenException('Tenant no encontrado');
        }
        await this.prisma.setTenant(tenant.id);
        return this.crmService.procesarWebhook(tenant.id, payload);
    }
    async verificarWebhook(tenantSlug, mode, verifyToken, challenge, res) {
        if (mode !== 'subscribe') {
            throw new common_1.BadRequestException('Modo no soportado');
        }
        const expected = this.messagingService.generarVerifyToken();
        if (verifyToken !== expected) {
            throw new common_1.ForbiddenException('Verify token inválido');
        }
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(challenge);
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, common_1.Get)('conversaciones'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filters_mensajes_dto_1.FiltersMensajesDto, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getConversaciones", null);
__decorate([
    (0, common_1.Get)('mensajes'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filters_mensajes_dto_1.FiltersMensajesDto, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getMensajes", null);
__decorate([
    (0, common_1.Post)('mensajes'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mensaje_dto_1.CreateMensajeDto, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "enviarMensaje", null);
__decorate([
    (0, common_1.Patch)('mensajes/:id/leido'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "marcarLeido", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('webhook/:tenantSlug'),
    __param(0, (0, common_1.Param)('tenantSlug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "recibirWebhook", null);
__decorate([
    (0, common_1.Get)('webhook/:tenantSlug'),
    __param(0, (0, common_1.Param)('tenantSlug')),
    __param(1, (0, common_1.Query)('hub.mode')),
    __param(2, (0, common_1.Query)('hub.verify_token')),
    __param(3, (0, common_1.Query)('hub.challenge')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "verificarWebhook", null);
exports.CrmController = CrmController = __decorate([
    (0, common_1.Controller)('crm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [crm_service_1.CrmService,
        messaging_service_1.MessagingService,
        prisma_service_1.PrismaService])
], CrmController);
//# sourceMappingURL=crm.controller.js.map