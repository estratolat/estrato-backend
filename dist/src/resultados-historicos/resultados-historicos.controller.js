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
exports.ResultadosHistoricosController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const resultados_historicos_service_1 = require("./resultados-historicos.service");
const filtros_resultados_dto_1 = require("./dto/filtros-resultados.dto");
const importar_resultados_dto_1 = require("./dto/importar-resultados.dto");
let ResultadosHistoricosController = class ResultadosHistoricosController {
    constructor(service) {
        this.service = service;
    }
    findAll(query, req) {
        return this.service.findAll(req.tenant.id, query);
    }
    resumen(req) {
        return this.service.resumen(req.tenant.id);
    }
    async importar(archivo, body, req) {
        return this.service.importar(req.tenant.id, archivo, {
            anio: body.anio,
            estado_id: body.estado_id,
            municipio_id: body.municipio_id,
        });
    }
};
exports.ResultadosHistoricosController = ResultadosHistoricosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filtros_resultados_dto_1.FiltrosResultadosDto, Object]),
    __metadata("design:returntype", void 0)
], ResultadosHistoricosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('resumen'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResultadosHistoricosController.prototype, "resumen", null);
__decorate([
    (0, common_1.Post)('importar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('archivo', {
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const ext = file.originalname.toLowerCase();
            const valid = ext.endsWith('.csv') || ext.endsWith('.txt');
            cb(valid ? null : new common_1.BadRequestException('Solo se permiten archivos CSV o TXT'), valid);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, importar_resultados_dto_1.ImportarResultadosDto, Object]),
    __metadata("design:returntype", Promise)
], ResultadosHistoricosController.prototype, "importar", null);
exports.ResultadosHistoricosController = ResultadosHistoricosController = __decorate([
    (0, common_1.Controller)('resultados-historicos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [resultados_historicos_service_1.ResultadosHistoricosService])
], ResultadosHistoricosController);
//# sourceMappingURL=resultados-historicos.controller.js.map