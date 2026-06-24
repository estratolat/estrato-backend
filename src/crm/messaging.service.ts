import { Injectable, Logger } from '@nestjs/common';

export interface MensajeExterno {
  canal: 'whatsapp' | 'messenger' | 'instagram';
  remitente_id: string;
  remitente_nombre?: string;
  destinatario_id?: string;
  id_externo: string;
  contenido: string;
  timestamp_ms?: number;
  metadata?: any;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  parseWebhook(payload: any): MensajeExterno[] {
    const object = payload?.object;
    const resultados: MensajeExterno[] = [];

    if (!object || !Array.isArray(payload?.entry)) {
      return resultados;
    }

    for (const entry of payload.entry) {
      if (object === 'whatsapp_business_account') {
        resultados.push(...this.parsearWhatsApp(entry));
      } else if (object === 'page') {
        resultados.push(...this.parsearMessenger(entry));
      } else if (object === 'instagram') {
        resultados.push(...this.parsearInstagram(entry));
      }
    }

    return resultados;
  }

  private parsearWhatsApp(entry: any): MensajeExterno[] {
    const mensajes: MensajeExterno[] = [];
    const value = entry?.changes?.[0]?.value;
    if (!value || !Array.isArray(value.messages)) return mensajes;

    const metadata = {
      phone_number_id: value.metadata?.phone_number_id,
      display_phone_number: value.metadata?.display_phone_number,
      entry_id: entry?.id,
    };

    const contactos = value.contacts || [];

    for (const msg of value.messages) {
      const contacto = contactos.find((c: any) => c.wa_id === msg.from) || {};
      let contenido = '';
      if (msg.text?.body) contenido = msg.text.body;
      else if (msg.image?.caption) contenido = `[imagen] ${msg.image.caption}`;
      else if (msg.image) contenido = '[imagen]';
      else if (msg.voice) contenido = '[audio]';
      else if (msg.location) contenido = `[ubicación: ${msg.location.latitude},${msg.location.longitude}]`;
      else contenido = `[${msg.type || 'mensaje'}]`;

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

  private parsearMessenger(entry: any): MensajeExterno[] {
    const mensajes: MensajeExterno[] = [];
    const messaging = entry?.messaging;
    if (!Array.isArray(messaging)) return mensajes;

    for (const m of messaging) {
      if (!m.message || m.message.is_echo) continue;
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

  private parsearInstagram(entry: any): MensajeExterno[] {
    const mensajes: MensajeExterno[] = [];
    const messaging = entry?.messaging;
    if (!Array.isArray(messaging)) return mensajes;

    for (const m of messaging) {
      if (!m.message || m.message.is_echo) continue;
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

  async enviarOutbound(
    canal: 'whatsapp' | 'messenger' | 'instagram',
    destinatarioId: string,
    contenido: string,
    extra?: any,
  ): Promise<{ ok: boolean; id_externo?: string; error?: string }> {
    // Stub: aquí se conectará con Meta Graph API / WhatsApp Business API.
    // Se deja preparado para cuando el usuario configure sus credenciales.
    this.logger.log(`[${canal}] outbound stub → ${destinatarioId}: ${contenido.slice(0, 40)}`);
    return { ok: false, error: 'Integración de envío externo no configurada. El mensaje se guardó localmente.' };
  }

  generarVerifyToken(): string {
    return process.env.META_WEBHOOK_VERIFY_TOKEN || 'estrato-crm-verify-token';
  }
}
