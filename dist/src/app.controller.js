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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let AppController = class AppController {
    health() {
        return {
            status: 'ok',
            service: 'ESTRATO API',
            timestamp: new Date().toISOString(),
        };
    }
    envCheck() {
        const anthropicKey = process.env.ANTHROPIC_API_KEY_2 || process.env.ANTHROPIC_API_KEY || '';
        const openaiKey = process.env.OPENAI_API_KEY_2 || process.env.OPENAI_API_KEY || '';
        return {
            anthropic_api_key_present: !!anthropicKey.trim(),
            anthropic_api_key_length: anthropicKey.length,
            anthropic_model: process.env.ANTHROPIC_MODEL || 'not-set',
            openai_api_key_present: !!openaiKey.trim(),
            node_env: process.env.NODE_ENV || 'not-set',
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('env-check'),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar presencia de variables de entorno (sin exponer valores)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "envCheck", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map