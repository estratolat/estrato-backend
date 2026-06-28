import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
export type CapaInegiWms = 'estados' | 'municipios' | 'localidades' | 'ageb' | 'manzanas' | 'vialidades' | 'geoelectorales';
interface TileParams {
    capa: CapaInegiWms;
    bbox: string;
    width: string;
    height: string;
    srs?: string;
    version?: string;
    format?: string;
    styles?: string;
    cve?: string;
    transparent?: string;
    indicador?: string;
}
export declare class InegiWmsService {
    private http;
    private readonly logger;
    private readonly endpoint;
    private readonly endpointTematico;
    private readonly layerNames;
    constructor(http: HttpService);
    proxyTile(params: TileParams, res: Response): Promise<void>;
    private transparentPng;
    private buildCql;
}
export {};
