"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MessagingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
let MessagingService = MessagingService_1 = class MessagingService {
    constructor() {
        this.logger = new common_1.Logger(MessagingService_1.name);
    }
    parseWebhook(payload) {
        const object = payload?.object;
        const resultados = [];
        if (!object || !Array.isArray(payload?.entry)) {
            return resultados;
        }
        for (const entry of payload.entry) {
            if (object === 'whatsapp_business_account') {
                resultados.push(...this.parsearWhatsApp(entry));
            }
            else if (object === 'page') {
                resultados.push(...this.parsearMessenger(entry));
            }
            else if (object === 'instagram') {
                resultados.push(...this.parsearInstagram(entry));
            }
        }
        return resultados;
    }
    parsearWhatsApp(entry) {
        const mensajes = [];
        const value = entry?.changes?.[0]?.value;
        if (!value || !Array.isArray(value.messages))
            return mensajes;
        const metadata = {
            phone_number_id: value.metadata?.phone_number_id,
            display_phone_number: value.metadata?.display_phone_number,
            entry_id: entry?.id,
        };
        const contactos = value.contacts || [];
        for (const msg of value.messages) {
            const contacto = contactos.find((c) => c.wa_id === msg.from) || {};
            let contenido = '';
            if (msg.text?.body)
                contenido = msg.text.body;
            else if (msg.image?.caption)
                contenido = `[imagen] ${msg.image.caption}`;
            else if (msg.image)
                contenido = '[imagen]';
            else if (msg.voice)
                contenido = '[audio]';
            else if (msg.location)
                contenido = `[ubicación: ${msg.location.latitude},${msg.location.longitude}]`;
            else
                contenido = `[${msg.type || 'mensaje'}]`;
            mensajes.push({
                canal: 'whatsapp',
                remitente_id: msg.from,
                remitente_nombre: contacto.profile?.name || undefined,
                destinatario_id: value.metadata?.phone_number_id,
                id_externo: msg.id,
                contenido,
                timestamp_ms: msg.timestamp ? Number(msg.timestamp) * 1000 : undefined,
                metadata: { ...metadata, raw: msg },
            });
        }
        return mensajes;
    }
    parsearMessenger(entry) {
        const mensajes = [];
        const messaging = entry?.messaging;
        if (!Array.isArray(messaging))
            return mensajes;
        for (const m of messaging) {
            if (!m.message || m.message.is_echo)
                continue;
            mensajes.push({
                canal: 'messenger',
                remitente_id: m.sender?.id,
                destinatario_id: m.recipient?.id,
                id_externo: m.message.mid,
                contenido: m.message.text || `[${m.message.attachments ? 'adjunto' : 'mensaje'}]`,
                timestamp_ms: m.timestamp ? Number(m.timestamp) : undefined,
                metadata: { raw: m },
            });
        }
        return mensajes;
    }
    parsearInstagram(entry) {
        const mensajes = [];
        const messaging = entry?.messaging;
        if (!Array.isArray(messaging))
            return mensajes;
        for (const m of messaging) {
            if (!m.message || m.message.is_echo)
                continue;
            mensajes.push({
                canal: 'instagram',
                remitente_id: m.sender?.id,
                destinatario_id: m.recipient?.id,
                id_externo: m.message.mid,
                contenido: m.message.text || `[${m.message.attachments ? 'adjunto' : 'mensaje'}]`,
                timestamp_ms: m.timestamp ? Number(m.timestamp) : undefined,
                metadata: { raw: m },
            });
        }
        return mensajes;
    }
    async enviarOutbound(canal, destinatarioId, contenido, extra) {
        this.logger.log(`[${canal}] outbound stub → ${destinatarioId}: ${contenido.slice(0, 40)}`);
        return { ok: false, error: 'Integración de envío externo no configurada. El mensaje se guardó localmente.' };
    }
    generarVerifyToken() {
        return process.env.META_WEBHOOK_VERIFY_TOKEN || 'estrato-crm-verify-token';
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)()
], MessagingService);
//# sourceMappingURL=messaging.service.js.map