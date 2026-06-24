export declare class TranscripcionService {
    private readonly logger;
    private client;
    private getClient;
    transcribirVideo(dataUrl: string): Promise<string>;
}
