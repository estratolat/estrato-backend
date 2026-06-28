import { HttpService } from '@nestjs/axios';
import { Point } from './geo-utils';
export interface AgebFeature {
    type: 'Feature';
    geometry: any;
    properties: Record<string, any>;
}
export declare class AgebInegiService {
    private http;
    private readonly logger;
    private readonly baseUrl;
    private cache;
    private readonly ttlMs;
    constructor(http: HttpService);
    buscarClaveMunicipio(cveEnt: string, nombreMunicipio: string): Promise<string | null>;
    buscarAgebs(cveEnt: string, cveMun: string): Promise<AgebFeature[]>;
    agebsCercanas(cveEnt: string, cveMun: string, punto: Point, radioKm?: number, maxResultados?: number): Promise<AgebFeature[]>;
    private normalizar;
}
