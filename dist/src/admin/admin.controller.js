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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const create_project_dto_1 = require("./dto/create-project.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../common/guards/super-admin.guard");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async listProjects() {
        return this.adminService.listProjects();
    }
    async getProject(id) {
        return this.adminService.getProject(id);
    }
    async createProject(data) {
        return this.adminService.createProject(data);
    }
    async limpiarCapasExternas() {
        return this.adminService.limpiarCapasExternas();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('projects'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos los proyectos (superadmin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listProjects", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de un proyecto (superadmin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProject", null);
__decorate([
    (0, common_1.Post)('projects'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nuevo proyecto con owner inicial (superadmin)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createProject", null);
__decorate([
    (0, common_1.Post)('limpiar-capas-externas'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar capas de fuentes externas (INEGI/Nominatim/SEPOMEX) de la base de datos' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "limpiarCapasExternas", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map