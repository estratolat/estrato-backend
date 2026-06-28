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
var ColoniasController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColoniasController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const colonias_service_1 = require("./colonias.service");
const mapas_service_1 = require("../mapas/mapas.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
class BuscarColoniaDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuscarColoniaDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BuscarColoniaDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BuscarColoniaDto.prototype, "municipio", void 0);
class ImportarColoniaDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarColoniaDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarColoniaDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarColoniaDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarColoniaDto.prototype, "municipio", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarColoniaDto.prototype, "codigo_postal", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarColoniaDto.prototype, "color", void 0);
let ColoniasController = ColoniasController_1 = class ColoniasController {
    constructor(coloniasService, mapasService) {
        this.coloniasService = coloniasService;
        this.mapasService = mapasService;
        this.logger = new common_1.Logger(ColoniasController_1.name);
    }
    async buscar(dto) {
        return this.coloniasService.buscar(dto.q, dto.estado, dto.municipio);
    }
    async importar(dto, req) {
        this.logger.log(`Importando colonia: id=${dto.id}, nombre=${dto.nombre}, tenant=${req.tenant.id}`);
        try {
            const [fuente, ...resto] = dto.id.split('_');
            if (!['sepomex', 'nominatim'].includes(fuente)) {
                throw new common_1.BadRequestException('ID de colonia inválido');
            }
            let colonia = null;
            if (fuente === 'sepomex') {
                const estadoId = resto[0];
                if (!estadoId) {
                    throw new common_1.BadRequestException('ID de colonia inválido');
                }
                colonia = await this.coloniasService.obtenerPorId(estadoId, dto.id);
            }
            else if (fuente === 'nominatim') {
                colonia = await this.coloniasService.obtenerPorIdNominatim(dto.id);
            }
            else if (fuente === 'inegi' && resto[0] === 'ageb') {
                colonia = await this.coloniasService.obtenerPorIdAgeb(dto.id);
            }
            if (!colonia || !colonia.geojson) {
                throw new common_1.BadRequestException('No se encontró el polígono de la colonia');
            }
            const geojson = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: colonia.geojson,
                        properties: {
                            nombre: dto.nombre,
                            codigo_postal: dto.codigo_postal || colonia.codigo_postal,
                            municipio: dto.municipio || colonia.municipio,
                            estado: colonia.estado,
                            fuente,
                            osm_id: dto.id,
                            aproximado: colonia.aproximado || false,
                        },
                    },
                ],
            };
            const capa = await this.mapasService.createCapa({
                nombre: dto.nombre,
                tipo: 'colonia',
                origen: 'externa',
                color: dto.color || '#D73216',
                visible: true,
                geojson,
                metadata: {
                    fuente,
                    osm_id: dto.id,
                    codigo_postal: dto.codigo_postal || colonia.codigo_postal,
                    municipio: dto.municipio || colonia.municipio,
                    estado: colonia.estado,
                    aproximado: colonia.aproximado || false,
                },
            }, req.tenant.id, req.usuario.id);
            this.logger.log(`Colonia guardada: id=${capa.id}, nombre=${capa.nombre}`);
            return { capa };
        }
        catch (err) {
            this.logger.error(`Error importando colonia id=${dto.id}: ${err?.message}`, err?.stack);
            if (err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('No se pudo guardar la colonia. Revisa los logs del servidor.');
        }
    }
};
exports.ColoniasController = ColoniasController;
__decorate([
    (0, common_1.Get)('buscar'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BuscarColoniaDto]),
    __metadata("design:returntype", Promise)
], ColoniasController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)('importar'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ImportarColoniaDto, Object]),
    __metadata("design:returntype", Promise)
], ColoniasController.prototype, "importar", null);
exports.ColoniasController = ColoniasController = ColoniasController_1 = __decorate([
    (0, common_1.Controller)('colonias'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [colonias_service_1.ColoniasService,
        mapas_service_1.MapasService])
], ColoniasController);
//# sourceMappingURL=colonias.controller.js.map