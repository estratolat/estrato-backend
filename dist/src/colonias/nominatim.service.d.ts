import { HttpService } from '@nestjs/axios';
import { ResultadoColonia } from './colonias.service';
export type FuenteColonia = 'nominatim' | 'sepomex';
export declare class ColoniasNominatimService {
    private http;
    private readonly logger;
    private readonly baseUrl;
    constructor(http: HttpService);
    buscar(query: string, estado?: string, municipio?: string): Promise<ResultadoColonia[]>;
}
