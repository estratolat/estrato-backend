export declare class CreateMensajeDto {
    votante_id: string;
    canal: 'whatsapp' | 'messenger' | 'instagram' | 'form' | 'sms' | 'email';
    contenido: string;
    template_usado?: string;
}
