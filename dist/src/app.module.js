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
const app_controller_1 = require("./app.controller");
const common_module_1 = require("./common/common.module");
const auth_module_1 = require("./auth/auth.module");
const tenants_module_1 = require("./tenants/tenants.module");
const users_module_1 = require("./users/users.module");
const votantes_module_1 = require("./votantes/votantes.module");
const lideres_module_1 = require("./lideres/lideres.module");
const zonas_module_1 = require("./zonas/zonas.module");
const eventos_module_1 = require("./eventos/eventos.module");
const apoyos_module_1 = require("./apoyos/apoyos.module");
const recorridos_module_1 = require("./recorridos/recorridos.module");
const crm_module_1 = require("./crm/crm.module");
const llamadas_module_1 = require("./llamadas/llamadas.module");
const boletines_module_1 = require("./boletines/boletines.module");
const ine_module_1 = require("./ine/ine.module");
const mapas_module_1 = require("./mapas/mapas.module");
const uploads_module_1 = require("./uploads/uploads.module");
const peticiones_module_1 = require("./peticiones/peticiones.module");
const candidato_module_1 = require("./candidato/candidato.module");
const inegi_module_1 = require("./inegi/inegi.module");
const resultados_historicos_module_1 = require("./resultados-historicos/resultados-historicos.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '../.env', '.env'],
            }),
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            users_module_1.UsersModule,
            votantes_module_1.VotantesModule,
            lideres_module_1.LideresModule,
            zonas_module_1.ZonasModule,
            eventos_module_1.EventosModule,
            apoyos_module_1.ApoyosModule,
            recorridos_module_1.RecorridosModule,
            crm_module_1.CrmModule,
            llamadas_module_1.LlamadasModule,
            boletines_module_1.BoletinesModule,
            ine_module_1.IneModule,
            mapas_module_1.MapasModule,
            uploads_module_1.UploadsModule,
            peticiones_module_1.PeticionesModule,
            candidato_module_1.CandidatoModule,
            inegi_module_1.InegiModule,
            resultados_historicos_module_1.ResultadosHistoricosModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map