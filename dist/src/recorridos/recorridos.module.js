"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecorridosModule = void 0;
const common_1 = require("@nestjs/common");
const recorridos_controller_1 = require("./recorridos.controller");
const recorridos_service_1 = require("./recorridos.service");
const prisma_service_1 = require("../common/services/prisma.service");
let RecorridosModule = class RecorridosModule {
};
exports.RecorridosModule = RecorridosModule;
exports.RecorridosModule = RecorridosModule = __decorate([
    (0, common_1.Module)({
        controllers: [recorridos_controller_1.RecorridosController],
        providers: [recorridos_service_1.RecorridosService, prisma_service_1.PrismaService],
        exports: [recorridos_service_1.RecorridosService],
    })
], RecorridosModule);
//# sourceMappingURL=recorridos.module.js.map