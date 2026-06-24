"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InegiModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const inegi_controller_1 = require("./inegi.controller");
const inegi_service_1 = require("./inegi.service");
const inegi_wms_service_1 = require("./inegi-wms.service");
const mapas_service_1 = require("../mapas/mapas.service");
const prisma_service_1 = require("../common/services/prisma.service");
let InegiModule = class InegiModule {
};
exports.InegiModule = InegiModule;
exports.InegiModule = InegiModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        controllers: [inegi_controller_1.InegiController],
        providers: [inegi_service_1.InegiService, inegi_wms_service_1.InegiWmsService, mapas_service_1.MapasService, prisma_service_1.PrismaService],
        exports: [inegi_service_1.InegiService, inegi_wms_service_1.InegiWmsService],
    })
], InegiModule);
//# sourceMappingURL=inegi.module.js.map