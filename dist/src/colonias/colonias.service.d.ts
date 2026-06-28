import { HttpService } from '@nestjs/axios';
import { SepomexCatalogoService } from './sepomex-catalogo.service';
import { ColoniasNominatimService } from './nominatim.service';
import { AgebInegiService } from './ageb-inegi.service';
export interface ResultadoColonia {
    id: string;
    nombre: string;
    tipo: string;
    codigo_postal?: string;
    municipio?: string;
    estado: string;
    estado_id: string;
    direccion?: string;
    geojson: any;
    fuente?: 'nominatim' | 'sepomex' | 'inegi-ageb';
    aproximado?: boolean;
}
export declare class ColoniasService {
    private http;
    private sepomex;
    private nominatim;
    private agebInegi;
    private readonly logger;
    private readonly baseUrl;
    private cache;
    private readonly ESTADO_CLAVE;
    constructor(http: HttpService, sepomex: SepomexCatalogoService, nominatim: ColoniasNominatimService, agebInegi: AgebInegiService);
    buscar(query: string, estado?: string, municipio?: string): Promise<ResultadoColonia[]>;
    private buscarAgebPorAsentamientos;
    obtenerPorId(estadoId: string, featureId: string): Promise<ResultadoColonia | null>;
    private descargarEstado;
    private buildUrls;
    private resolverEstadoId;
    private featureAResultado;
    private crearId;
    obtenerPorIdNominatim(featureId: string): Promise<ResultadoColonia | null>;
    obtenerPorIdAgeb(featureId: string): Promise<ResultadoColonia | null>;
    private featurePorCp;
    private buscarPorCpEnGeojson;
    private coincideEstado;
    private coincideTexto;
    private normalizar;
    private nombreEstado;
}
