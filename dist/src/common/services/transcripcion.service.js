"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TranscripcionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscripcionService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
let TranscripcionService = TranscripcionService_1 = class TranscripcionService {
    constructor() {
        this.logger = new common_1.Logger(TranscripcionService_1.name);
        this.client = null;
    }
    getClient() {
        const apiKey = process.env.OPENAI_API_KEY_2 || process.env.OPENAI_API_KEY || '';
        if (!apiKey) {
            throw new common_1.BadRequestException('OPENAI_API_KEY no está configurada. La transcripción automática no está disponible.');
        }
        if (!this.client) {
            this.client = new openai_1.default({ apiKey });
        }
        return this.client;
    }
    async transcribirVideo(dataUrl) {
        if (!dataUrl || !dataUrl.startsWith('data:')) {
            throw new common_1.BadRequestException('Se requiere una data URL válida de video');
        }
        const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
        if (!match) {
            throw new common_1.BadRequestException('Formato de data URL inválido');
        }
        const [, mime, base64] = match;
        const buffer = Buffer.from(base64, 'base64');
        this.logger.log(`Transcribiendo video: ${mime}, tamaño ${buffer.length} bytes`);
        const ext = mime.includes('mp4') ? 'mp4' : mime.split('/')[1] || 'webm';
        const tmpDir = os.tmpdir();
        const inputPath = path.join(tmpDir, `video_${Date.now()}.${ext}`);
        const audioPath = path.join(tmpDir, `audio_${Date.now()}.mp3`);
        try {
            fs.writeFileSync(inputPath, buffer);
            const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
            try {
                execSync(`ffmpeg -i "${inputPath}" -vn -ar 16000 -ac 1 -b:a 32k "${audioPath}" -y`, {
                    stdio: 'pipe',
                    timeout: 120000,
                });
            }
            catch (ffmpegError) {
                this.logger.warn('ffmpeg no disponible o falló. Intentando transcribir archivo original.');
                fs.copyFileSync(inputPath, audioPath);
            }
            const fileStream = fs.createReadStream(audioPath);
            const client = this.getClient();
            const response = await client.audio.transcriptions.create({
                file: fileStream,
                model: 'whisper-1',
                language: 'es',
                response_format: 'text',
            });
            return typeof response === 'string' ? response : response.text || '';
        }
        finally {
            try {
                fs.unlinkSync(inputPath);
            }
            catch { }
            try {
                fs.unlinkSync(audioPath);
            }
            catch { }
        }
    }
};
exports.TranscripcionService = TranscripcionService;
exports.TranscripcionService = TranscripcionService = TranscripcionService_1 = __decorate([
    (0, common_1.Injectable)()
], TranscripcionService);
//# sourceMappingURL=transcripcion.service.js.map