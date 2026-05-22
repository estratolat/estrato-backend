"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const tenants_module_1 = require("./tenants/tenants.module");
const users_module_1 = require("./users/users.module");
const votantes_module_1 = require("./votantes/votantes.module");
const lideres_module_1 = require("./lideres/lideres.module");
const eventos_module_1 = require("./eventos/eventos.module");
const apoyos_module_1 = require("./apoyos/apoyos.module");
const recorridos_module_1 = require("./recorridos/recorridos.module");
const crm_module_1 = require("./crm/crm.module");
const vapi_module_1 = require("./vapi/vapi.module");
const boletines_module_1 = require("./boletines/boletines.module");
const ine_module_1 = require("./ine/ine.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['../.env', '.env'],
            }),
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            users_module_1.UsersModule,
            votantes_module_1.VotantesModule,
            lideres_module_1.LideresModule,
            eventos_module_1.EventosModule,
            apoyos_module_1.ApoyosModule,
            recorridos_module_1.RecorridosModule,
            crm_module_1.CrmModule,
            vapi_module_1.VapiModule,
            boletines_module_1.BoletinesModule,
            ine_module_1.IneModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map