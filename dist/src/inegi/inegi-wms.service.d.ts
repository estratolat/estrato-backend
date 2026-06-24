import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
export type CapaInegiWms = 'estados' | 'municipios' | 'localidades' | 'ageb' | 'manzanas' | 'vialidades';
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
}
export declare class InegiWmsService {
    private http;
    private readonly logger;
    private readonly endpoint;
    private readonly layerNames;
    constructor(http: HttpService);
    proxyTile(params: TileParams, res: Response): Promise<void>;
    private buildCql;
}
export {};
