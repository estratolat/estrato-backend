"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
let UploadsService = class UploadsService {
    toBase64DataUrl(file) {
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('No se recibió archivo');
        }
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Solo se permiten imágenes JPEG, PNG o WebP');
        }
        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            throw new common_1.BadRequestException('La imagen no debe exceder 5 MB');
        }
        const base64 = file.buffer.toString('base64');
        return `data:${file.mimetype};base64,${base64}`;
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)()
], UploadsService);
//# sourceMappingURL=uploads.service.js.map