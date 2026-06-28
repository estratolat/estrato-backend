import { HttpService } from '@nestjs/axios';
export type TipoCapaInegi = 'estados' | 'municipios' | 'localidades' | 'ageb' | 'manzanas' | 'vialidades';
export interface ResultadoBusquedaInegi {
    clave: string;
    nombre: string;
    tipo: TipoCapaInegi;
    entidad?: string;
    municipio?: string;
    localidad?: string;
    feature?: any;
}
export declare class InegiService {
    private http;
    private readonly logger;
    private readonly baseUrl;
    constructor(http: HttpService);
    descargar(tipo: TipoCapaInegi, clave?: string): Promise<any>;
    private fetchJson;
    private buildUrls;
    buscar(tipo: TipoCapaInegi, query: string, ent?: string, mun?: string, loc?: string): Promise<ResultadoBusquedaInegi[]>;
    obtenerPorClave(tipo: TipoCapaInegi, clave: string, ent?: string, mun?: string, loc?: string): Promise<any>;
    private filtrarFeatures;
    private limpiarClave;
    private partes;
}
