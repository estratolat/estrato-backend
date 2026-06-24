export interface HuellaCandidato {
    palabras_clave: string[];
    muletillas: string[];
    frases_recurrentes: string[];
    llamados_accion: string[];
    tono: string;
    propuesta_central: string;
    estilo_redes: string;
}
export declare class AnthropicService {
    private readonly logger;
    private client;
    private readonly model;
    constructor();
    private getClient;
    analizarCandidato(discurso: string, transcripcion: string): Promise<HuellaCandidato>;
    generarConHuella(huella: HuellaCandidato, contexto: {
        perfil: {
            nombre?: string;
            biografia?: string;
            gustos?: string;
            propuesta_central?: string;
        };
        tipo: 'boletin' | 'redes';
        contexto: {
            tema?: string;
            que?: string;
            quien?: string;
            como?: string;
            cuando?: string;
            donde?: string;
            por_que?: string;
            para_que?: string;
        };
    }): Promise<{
        titulo?: string;
        bajada?: string;
        desarrollo?: string;
        texto?: string;
        caption?: string;
        hashtags?: string[];
        idea_imagen?: string;
        versiones_redes?: {
            caption: string;
            hashtags: string[];
            idea_imagen: string;
        }[];
    }>;
    private construirPrompt;
    private construirPromptGeneracion;
    private parsearHuella;
    private parsearGeneracion;
    private extraerJson;
}
