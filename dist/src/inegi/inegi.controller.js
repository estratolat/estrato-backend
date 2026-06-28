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
var InegiController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InegiController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const inegi_service_1 = require("./inegi.service");
const inegi_wms_service_1 = require("./inegi-wms.service");
const nominatim_service_1 = require("./nominatim.service");
const mapas_service_1 = require("../mapas/mapas.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
class DescargarDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['estados', 'municipios', 'localidades', 'ageb', 'manzanas', 'vialidades']),
    __metadata("design:type", String)
], DescargarDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DescargarDto.prototype, "clave", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DescargarDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DescargarDto.prototype, "color", void 0);
class BuscarDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['estados', 'municipios', 'localidades', 'ageb', 'manzanas', 'vialidades']),
    __metadata("design:type", String)
], BuscarDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuscarDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BuscarDto.prototype, "ent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BuscarDto.prototype, "mun", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BuscarDto.prototype, "loc", void 0);
class ImportarPorClaveDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['estados', 'municipios', 'localidades', 'ageb', 'manzanas', 'vialidades']),
    __metadata("design:type", String)
], ImportarPorClaveDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarPorClaveDto.prototype, "clave", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarPorClaveDto.prototype, "ent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarPorClaveDto.prototype, "mun", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarPorClaveDto.prototype, "loc", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarPorClaveDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarPorClaveDto.prototype, "color", void 0);
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
], BuscarColoniaDto.prototype, "ent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BuscarColoniaDto.prototype, "mun", void 0);
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
], ImportarColoniaDto.prototype, "direccion", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarColoniaDto.prototype, "color", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarColoniaDto.prototype, "ent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportarColoniaDto.prototype, "mun", void 0);
let InegiController = InegiController_1 = class InegiController {
    constructor(inegiService, inegiWmsService, nominatimService, mapasService) {
        this.inegiService = inegiService;
        this.inegiWmsService = inegiWmsService;
        this.nominatimService = nominatimService;
        this.mapasService = mapasService;
        this.logger = new common_1.Logger(InegiController_1.name);
    }
    async proxyWms(res, capa, bbox, width, height, srs, version, format, styles, cve, transparent, indicador) {
        return this.inegiWmsService.proxyTile({ capa, bbox, width, height, srs, version, format, styles, cve, transparent, indicador }, res);
    }
    async buscar(dto) {
        return this.inegiService.buscar(dto.tipo, dto.q, dto.ent, dto.mun, dto.loc);
    }
    async buscarColonia(dto) {
        return this.nominatimService.buscar(dto.q, dto.ent, dto.mun);
    }
    async descargar(tipo, clave) {
        return this.inegiService.descargar(tipo, clave);
    }
    async importar(dto, req) {
        this.logger.log(`Importando INEGI: tipo=${dto.tipo}, clave=${dto.clave}, tenant=${req.tenant.id}`);
        try {
            const geojson = await this.inegiService.descargar(dto.tipo, dto.clave);
            const featureCount = geojson?.features?.length || 0;
            this.logger.log(`INEGI descargado: ${featureCount} features para tipo=${dto.tipo}, clave=${dto.clave}`);
            const nombre = dto.nombre || `INEGI ${dto.tipo}${dto.clave ? ` ${dto.clave}` : ''}`;
            const capa = await this.mapasService.createCapa({
                nombre,
                tipo: 'inegi',
                origen: 'externa',
                color: dto.color || '#6B7280',
                visible: true,
                geojson,
                metadata: {
                    fuente: 'inegi',
                    tipo_inegi: dto.tipo,
                    clave: dto.clave,
                },
            }, req.tenant.id, req.usuario.id);
            this.logger.log(`Capa INEGI guardada: id=${capa.id}, nombre=${capa.nombre}`);
            return {
                capa,
                features: featureCount,
            };
        }
        catch (err) {
            this.logger.error(`Error importando INEGI tipo=${dto.tipo}, clave=${dto.clave}: ${err?.message}`, err?.stack);
            if (err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('No se pudo guardar la capa del INEGI. Revisa los logs del servidor.');
        }
    }
    async importarPorClave(dto, req) {
        this.logger.log(`Importando INEGI por clave: tipo=${dto.tipo}, clave=${dto.clave}, tenant=${req.tenant.id}`);
        try {
            const geojson = await this.inegiService.obtenerPorClave(dto.tipo, dto.clave, dto.ent, dto.mun, dto.loc);
            const featureCount = geojson?.features?.length || 0;
            const nombre = dto.nombre || `INEGI ${dto.tipo} ${dto.clave}`;
            const capa = await this.mapasService.createCapa({
                nombre,
                tipo: 'inegi',
                origen: 'externa',
                color: dto.color || '#6B7280',
                visible: true,
                geojson,
                metadata: {
                    fuente: 'inegi',
                    tipo_inegi: dto.tipo,
                    clave: dto.clave,
                    entidad: dto.ent,
                    municipio: dto.mun,
                    localidad: dto.loc,
                },
            }, req.tenant.id, req.usuario.id);
            this.logger.log(`Capa INEGI guardada: id=${capa.id}, nombre=${capa.nombre}`);
            return {
                capa,
                features: featureCount,
            };
        }
        catch (err) {
            this.logger.error(`Error importando INEGI por clave tipo=${dto.tipo}, clave=${dto.clave}: ${err?.message}`, err?.stack);
            if (err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('No se pudo guardar la capa del INEGI. Revisa los logs del servidor.');
        }
    }
    async importarColonia(dto, req) {
        this.logger.log(`Importando colonia desde Nominatim: id=${dto.id}, nombre=${dto.nombre}, tenant=${req.tenant.id}`);
        try {
            const resultados = await this.nominatimService.buscar(dto.nombre, dto.ent, dto.mun);
            const seleccionado = resultados.find((r) => r.id === dto.id);
            if (!seleccionado || !seleccionado.geojson) {
                throw new common_1.BadRequestException('No se encontró el polígono de la colonia seleccionada');
            }
            const geojson = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: seleccionado.geojson,
                        properties: {
                            nombre: dto.nombre,
                            direccion: dto.direccion || seleccionado.direccion,
                            fuente: 'nominatim',
                            osm_id: dto.id,
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
                    fuente: 'nominatim',
                    osm_id: dto.id,
                    direccion: dto.direccion || seleccionado.direccion,
                    entidad: dto.ent,
                    municipio: dto.mun,
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
exports.InegiController = InegiController;
__decorate([
    (0, common_1.Get)('wms'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('capa')),
    __param(2, (0, common_1.Query)('bbox')),
    __param(3, (0, common_1.Query)('width')),
    __param(4, (0, common_1.Query)('height')),
    __param(5, (0, common_1.Query)('srs')),
    __param(6, (0, common_1.Query)('version')),
    __param(7, (0, common_1.Query)('format')),
    __param(8, (0, common_1.Query)('styles')),
    __param(9, (0, common_1.Query)('cve')),
    __param(10, (0, common_1.Query)('transparent')),
    __param(11, (0, common_1.Query)('indicador')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InegiController.prototype, "proxyWms", null);
__decorate([
    (0, common_1.Get)('buscar'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BuscarDto]),
    __metadata("design:returntype", Promise)
], InegiController.prototype, "buscar", null);
__decorate([
    (0, common_1.Get)('buscar-colonia'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BuscarColoniaDto]),
    __metadata("design:returntype", Promise)
], InegiController.prototype, "buscarColonia", null);
__decorate([
    (0, common_1.Get)(':tipo'),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Query)('clave')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InegiController.prototype, "descargar", null);
__decorate([
    (0, common_1.Post)('importar'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DescargarDto, Object]),
    __metadata("design:returntype", Promise)
], InegiController.prototype, "importar", null);
__decorate([
    (0, common_1.Post)('importar-por-clave'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ImportarPorClaveDto, Object]),
    __metadata("design:returntype", Promise)
], InegiController.prototype, "importarPorClave", null);
__decorate([
    (0, common_1.Post)('importar-colonia'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ImportarColoniaDto, Object]),
    __metadata("design:returntype", Promise)
], InegiController.prototype, "importarColonia", null);
exports.InegiController = InegiController = InegiController_1 = __decorate([
    (0, common_1.Controller)('inegi'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [inegi_service_1.InegiService,
        inegi_wms_service_1.InegiWmsService,
        nominatim_service_1.NominatimService,
        mapas_service_1.MapasService])
], InegiController);
//# sourceMappingURL=inegi.controller.js.map