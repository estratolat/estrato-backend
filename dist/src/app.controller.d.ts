export declare class AppController {
    health(): {
        status: string;
        service: string;
        timestamp: string;
    };
    envCheck(): {
        anthropic_api_key_present: boolean;
        anthropic_api_key_length: number;
        anthropic_model: string;
        openai_api_key_present: boolean;
        node_env: string;
    };
}
