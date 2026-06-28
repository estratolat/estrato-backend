"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColoniasModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const colonias_controller_1 = require("./colonias.controller");
const colonias_service_1 = require("./colonias.service");
const sepomex_catalogo_service_1 = require("./sepomex-catalogo.service");
const nominatim_service_1 = require("./nominatim.service");
const ageb_inegi_service_1 = require("./ageb-inegi.service");
const mapas_service_1 = require("../mapas/mapas.service");
const prisma_service_1 = require("../common/services/prisma.service");
let ColoniasModule = class ColoniasModule {
};
exports.ColoniasModule = ColoniasModule;
exports.ColoniasModule = ColoniasModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        controllers: [colonias_controller_1.ColoniasController],
        providers: [
            colonias_service_1.ColoniasService,
            sepomex_catalogo_service_1.SepomexCatalogoService,
            nominatim_service_1.ColoniasNominatimService,
            ageb_inegi_service_1.AgebInegiService,
            mapas_service_1.MapasService,
            prisma_service_1.PrismaService,
        ],
        exports: [colonias_service_1.ColoniasService],
    })
], ColoniasModule);
//# sourceMappingURL=colonias.module.js.map