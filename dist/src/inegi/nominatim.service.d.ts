import { HttpService } from '@nestjs/axios';
export interface ResultadoColonia {
    id: string;
    nombre: string;
    tipo: string;
    direccion: string;
    lat: number;
    lon: number;
    geojson: any;
}
export declare class NominatimService {
    private http;
    private readonly logger;
    private readonly baseUrl;
    constructor(http: HttpService);
    buscar(query: string, entidad?: string, municipio?: string): Promise<ResultadoColonia[]>;
}
