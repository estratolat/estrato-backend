import { HttpService } from '@nestjs/axios';
export type TipoCapaInegi = 'estados' | 'municipios' | 'localidades' | 'ageb' | 'manzanas' | 'vialidades';
export declare class InegiService {
    private http;
    private readonly logger;
    private readonly baseUrl;
    constructor(http: HttpService);
    descargar(tipo: TipoCapaInegi, clave?: string): Promise<any>;
    private fetchJson;
    private buildUrls;
    private limpiarClave;
    private partes;
}
