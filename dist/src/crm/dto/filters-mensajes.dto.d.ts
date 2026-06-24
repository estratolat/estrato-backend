export declare class FiltersMensajesDto {
    votante_id?: string;
    canal?: 'whatsapp' | 'messenger' | 'instagram' | 'form' | 'sms' | 'email';
    direccion?: 'inbound' | 'outbound';
    search?: string;
    limit?: number;
}
