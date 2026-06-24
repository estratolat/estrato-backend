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
export declare class MessagingService {
    private readonly logger;
    parseWebhook(payload: any): MensajeExterno[];
    private parsearWhatsApp;
    private parsearMessenger;
    private parsearInstagram;
    enviarOutbound(canal: 'whatsapp' | 'messenger' | 'instagram', destinatarioId: string, contenido: string, extra?: any): Promise<{
        ok: boolean;
        id_externo?: string;
        error?: string;
    }>;
    generarVerifyToken(): string;
}
