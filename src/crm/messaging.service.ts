import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

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

export interface CanalCrmConfig {
  id: string;
  tenant_id: string;
  canal: string;
  nombre: string;
  proveedor: string;
  cuenta_id?: string | null;
  access_token?: string | null;
  desde_numero?: string | null;
  webhook_path?: string | null;
  verify_token?: string | null;
  activo: boolean;
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
      else if (msg.location)
        contenido = `[ubicación: ${msg.location.latitude},${msg.location.longitude}]`;
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
        contenido:
          m.message.text ||
          `[${m.message.attachments ? 'adjunto' : 'mensaje'}]`,
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
        contenido:
          m.message.text ||
          `[${m.message.attachments ? 'adjunto' : 'mensaje'}]`,
        timestamp_ms: m.timestamp ? Number(m.timestamp) : undefined,
        metadata: { raw: m },
      });
    }

    return mensajes;
  }

  async enviarOutbound(
    canal: 'whatsapp' | 'messenger' | 'instagram' | 'sms' | 'email',
    destinatarioId: string,
    contenido: string,
    extra?: { canalCrm?: CanalCrmConfig },
  ): Promise<{ ok: boolean; id_externo?: string; error?: string }> {
    const canalCrm = extra?.canalCrm;

    if (!canalCrm?.access_token) {
      this.logger.warn(
        `[${canal}] No hay access_token configurado para el canal ${canalCrm?.id || 'default'}`,
      );
      return {
        ok: false,
        error:
          'Canal CRM sin access_token configurado. El mensaje se guardó localmente.',
      };
    }

    try {
      if (canal === 'whatsapp') {
        const phoneNumberId = canalCrm.cuenta_id;
        if (!phoneNumberId) {
          return { ok: false, error: 'Canal WhatsApp sin cuenta_id (phone_number_id)' };
        }

        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
        const { data } = await axios.post(
          url,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: destinatarioId.replace(/\D/g, ''),
            type: 'text',
            text: { body: contenido },
          },
          {
            headers: {
              Authorization: `Bearer ${canalCrm.access_token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        return { ok: true, id_externo: data.messages?.[0]?.id };
      }

      if (canal === 'messenger' || canal === 'instagram') {
        const pageOrIgId = canalCrm.cuenta_id || 'me';
        const url = `https://graph.facebook.com/v18.0/${pageOrIgId}/messages`;
        const { data } = await axios.post(
          url,
          {
            recipient: { id: destinatarioId },
            message: { text: contenido },
          },
          {
            headers: {
              Authorization: `Bearer ${canalCrm.access_token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        return { ok: true, id_externo: data.message_id };
      }

      // SMS / Email requieren proveedores adicionales (Twilio, SMTP, etc.)
      this.logger.log(
        `[${canal}] outbound no implementado aún para ${destinatarioId}`,
      );
      return {
        ok: false,
        error: `Envío por ${canal} aún no implementado. El mensaje se guardó localmente.`,
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Error desconocido al enviar mensaje externo';
      this.logger.error(
        `[${canal}] Error enviando outbound: ${errorMsg}`,
        err.stack,
      );
      return { ok: false, error: errorMsg };
    }
  }

  generarVerifyToken(canalCrm?: CanalCrmConfig): string {
    return (
      canalCrm?.verify_token ||
      process.env.META_WEBHOOK_VERIFY_TOKEN ||
      'estrato-crm-verify-token'
    );
  }
}
