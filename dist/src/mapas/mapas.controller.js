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
exports.MapasController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const mapas_service_1 = require("./mapas.service");
const gis_parser_service_1 = require("./gis-parser.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../common/guards/tenant.guard");
const importar_secciones_ine_dto_1 = require("./dto/importar-secciones-ine.dto");
const importar_secciones_excel_dto_1 = require("./dto/importar-secciones-excel.dto");
const buscar_global_dto_1 = require("./dto/buscar-global.dto");
const detalle_territorial_dto_1 = require("./dto/detalle-territorial.dto");
let MapasController = class MapasController {
    constructor(mapasService, gisParser) {
        this.mapasService = mapasService;
        this.gisParser = gisParser;
    }
    findAllCapas(req) {
        return this.mapasService.findAllCapas(req.tenant.id);
    }
    findOneCapa(id, req) {
        return this.mapasService.findOneCapa(id, req.tenant.id);
    }
    createCapa(data, req) {
        return this.mapasService.createCapa(data, req.tenant.id, req.usuario?.id);
    }
    updateCapa(id, data, req) {
        return this.mapasService.updateCapa(id, data, req.tenant.id);
    }
    removeCapa(id, req) {
        return this.mapasService.removeCapa(id, req.tenant.id);
    }
    geojson(query, req) {
        const capas = query.capas
            ? query.capas.split(',').map((c) => c.trim()).filter(Boolean)
            : [];
        return this.mapasService.geojson(req.tenant.id, capas, query);
    }
    async findAllSeccionesINE(estadoId, municipioId, req) {
        return this.mapasService.findAllSeccionesINE(req.tenant.id, estadoId ? Number(estadoId) : undefined, municipioId ? Number(municipioId) : undefined);
    }
    async importarSeccionesINE(archivo, body, req) {
        if (!archivo) {
            throw new common_1.BadRequestException('No se recibió archivo');
        }
        const shapefileHint = body.shapefile_hint;
        const geojson = await this.gisParser.parse(archivo, undefined, shapefileHint);
        return this.mapasService.importarSeccionesINE(req.tenant.id, req.usuario?.id, geojson, {
            nombre: body.nombre,
            color: body.color,
            estado_id: Number(body.estado_id),
            estado: body.estado,
            municipio_id: body.municipio_id != null ? Number(body.municipio_id) : undefined,
            municipio: body.municipio,
            anio: body.anio ? Number(body.anio) : undefined,
        });
    }
    async importarSeccionesExcel(archivo, body, req) {
        if (!archivo) {
            throw new common_1.BadRequestException('No se recibió archivo');
        }
        return this.mapasService.importarSeccionesExcel(req.tenant.id, archivo.buffer, {
            estado_id: body.estado_id ? Number(body.estado_id) : undefined,
            estado: body.estado,
        });
    }
    async buscarGlobal(dto, req) {
        const limit = dto.limit ? parseInt(dto.limit, 10) : 15;
        return this.mapasService.buscarGlobal(req.tenant.id, dto.q, limit, dto.tipo);
    }
    async detalleTerritorial(dto, req) {
        return this.mapasService.detalleTerritorial(req.tenant.id, dto);
    }
    seedDemo(req) {
        return this.mapasService.seedDemo(req.tenant.id);
    }
    async subirArchivo(archivo, body, req) {
        if (!archivo) {
            throw new common_1.BadRequestException('No se recibió archivo');
        }
        const tipoArchivo = body.tipo_archivo;
        const shapefileHint = body.shapefile_hint || body.shapefileHint;
        console.log('[subirArchivo] archivo:', archivo.originalname, 'tipo:', tipoArchivo, 'size:', archivo.size, 'mimetype:', archivo.mimetype, 'hint:', shapefileHint);
        const geojson = await this.gisParser.parse(archivo, tipoArchivo, shapefileHint);
        const metadataRaw = body.metadata ? JSON.parse(body.metadata) : {};
        const capa = await this.mapasService.createCapa({
            nombre: body.nombre || archivo.originalname,
            tipo: 'custom',
            origen: 'propia',
            color: body.color || '#D73216',
            visible: body.visible !== 'false',
            geojson,
            metadata: {
                ...metadataRaw,
                archivo_original: archivo.originalname,
                tipo_archivo: tipoArchivo || this.gisParser.detectarTipo(archivo.originalname),
                tamanio_bytes: archivo.size,
                seccion_electoral: body.seccion_electoral || metadataRaw.seccion_electoral || null,
                capa_territorio: metadataRaw.capa_territorio || null,
            },
        }, req.tenant.id, req.usuario?.id);
        return {
            message: 'Archivo procesado y convertido en capa',
            capa,
            features_count: geojson.features?.length || 0,
        };
    }
    async estadisticas(nivel, req) {
        try {
            const nivelValido = nivel === 'zona' ? 'zona' : 'seccion';
            return await this.mapasService.estadisticas(req.tenant.id, nivelValido);
        }
        catch (err) {
            console.error('[MapasController.estadisticas] ERROR:', err?.message, err?.stack);
            throw err;
        }
    }
};
exports.MapasController = MapasController;
__decorate([
    (0, common_1.Get)('capas'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MapasController.prototype, "findAllCapas", null);
__decorate([
    (0, common_1.Get)('capas/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MapasController.prototype, "findOneCapa", null);
__decorate([
    (0, common_1.Post)('capas'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MapasController.prototype, "createCapa", null);
__decorate([
    (0, common_1.Patch)('capas/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], MapasController.prototype, "updateCapa", null);
__decorate([
    (0, common_1.Delete)('capas/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MapasController.prototype, "removeCapa", null);
__decorate([
    (0, common_1.Get)('geojson'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MapasController.prototype, "geojson", null);
__decorate([
    (0, common_1.Get)('secciones-ine'),
    __param(0, (0, common_1.Query)('estado_id')),
    __param(1, (0, common_1.Query)('municipio_id')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MapasController.prototype, "findAllSeccionesINE", null);
__decorate([
    (0, common_1.Post)('secciones-ine/importar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('archivo', {
        limits: { fileSize: 150 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowed = ['.kml', '.geojson', '.json', '.zip', '.gpx'];
            const ext = file.originalname.toLowerCase();
            const valid = allowed.some(a => ext.endsWith(a));
            cb(valid ? null : new common_1.BadRequestException('Solo se permiten KML, GeoJSON, Shapefile (.zip) o GPX'), valid);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, importar_secciones_ine_dto_1.ImportarSeccionesIneDto, Object]),
    __metadata("design:returntype", Promise)
], MapasController.prototype, "importarSeccionesINE", null);
__decorate([
    (0, common_1.Post)('secciones/importar-excel'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('archivo', {
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowed = ['.xlsx', '.xls', '.csv'];
            const ext = file.originalname.toLowerCase();
            const valid = allowed.some(a => ext.endsWith(a));
            cb(valid ? null : new common_1.BadRequestException('Solo se permiten archivos Excel (.xlsx, .xls) o CSV'), valid);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, importar_secciones_excel_dto_1.ImportarSeccionesExcelDto, Object]),
    __metadata("design:returntype", Promise)
], MapasController.prototype, "importarSeccionesExcel", null);
__decorate([
    (0, common_1.Get)('buscar-global'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [buscar_global_dto_1.BuscarGlobalDto, Object]),
    __metadata("design:returntype", Promise)
], MapasController.prototype, "buscarGlobal", null);
__decorate([
    (0, common_1.Post)('buscar-global/detalle'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [detalle_territorial_dto_1.DetalleTerritorialDto, Object]),
    __metadata("design:returntype", Promise)
], MapasController.prototype, "detalleTerritorial", null);
__decorate([
    (0, common_1.Post)('seed-demo'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MapasController.prototype, "seedDemo", null);
__decorate([
    (0, common_1.Post)('subir'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('archivo', {
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowed = ['.kml', '.geojson', '.json', '.zip', '.gpx'];
            const ext = file.originalname.toLowerCase();
            const valid = allowed.some(a => ext.endsWith(a));
            cb(valid ? null : new common_1.BadRequestException('Solo se permiten KML, GeoJSON, Shapefile (.zip) o GPX'), valid);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], MapasController.prototype, "subirArchivo", null);
__decorate([
    (0, common_1.Get)('estadisticas'),
    __param(0, (0, common_1.Query)('nivel')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MapasController.prototype, "estadisticas", null);
exports.MapasController = MapasController = __decorate([
    (0, common_1.Controller)('mapas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [mapas_service_1.MapasService,
        gis_parser_service_1.GisParserService])
], MapasController);
//# sourceMappingURL=mapas.controller.js.map