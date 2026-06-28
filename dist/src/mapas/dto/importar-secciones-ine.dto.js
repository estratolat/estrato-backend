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
exports.ImportarSeccionesIneDto = void 0;
const class_validator_1 = require("class-validator");
class ImportarSeccionesIneDto {
}
exports.ImportarSeccionesIneDto = ImportarSeccionesIneDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarSeccionesIneDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarSeccionesIneDto.prototype, "color", void 0);
__decorate([
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], ImportarSeccionesIneDto.prototype, "estado_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarSeccionesIneDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], ImportarSeccionesIneDto.prototype, "municipio_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarSeccionesIneDto.prototype, "municipio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarSeccionesIneDto.prototype, "anio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportarSeccionesIneDto.prototype, "shapefile_hint", void 0);
//# sourceMappingURL=importar-secciones-ine.dto.js.map