"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapasModule = void 0;
const common_1 = require("@nestjs/common");
const mapas_controller_1 = require("./mapas.controller");
const mapas_service_1 = require("./mapas.service");
const gis_parser_service_1 = require("./gis-parser.service");
const prisma_service_1 = require("../common/services/prisma.service");
let MapasModule = class MapasModule {
};
exports.MapasModule = MapasModule;
exports.MapasModule = MapasModule = __decorate([
    (0, common_1.Module)({
        controllers: [mapas_controller_1.MapasController],
        providers: [mapas_service_1.MapasService, gis_parser_service_1.GisParserService, prisma_service_1.PrismaService],
    })
], MapasModule);
//# sourceMappingURL=mapas.module.js.map