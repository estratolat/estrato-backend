export declare class WebhookLlamadasDto {
    message?: {
        type?: string;
        call?: any;
        assistantId?: string;
        phoneNumber?: {
            id?: string;
            number?: string;
        };
        customer?: {
            number?: string;
            name?: string;
        };
        status?: string;
        transcript?: string;
        recordingUrl?: string;
        durationSeconds?: number;
        summary?: string;
        endedReason?: string;
        [key: string]: any;
    };
}
