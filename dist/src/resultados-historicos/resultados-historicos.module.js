"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultadosHistoricosModule = void 0;
const common_1 = require("@nestjs/common");
const resultados_historicos_controller_1 = require("./resultados-historicos.controller");
const resultados_historicos_service_1 = require("./resultados-historicos.service");
let ResultadosHistoricosModule = class ResultadosHistoricosModule {
};
exports.ResultadosHistoricosModule = ResultadosHistoricosModule;
exports.ResultadosHistoricosModule = ResultadosHistoricosModule = __decorate([
    (0, common_1.Module)({
        controllers: [resultados_historicos_controller_1.ResultadosHistoricosController],
        providers: [resultados_historicos_service_1.ResultadosHistoricosService],
    })
], ResultadosHistoricosModule);
//# sourceMappingURL=resultados-historicos.module.js.map