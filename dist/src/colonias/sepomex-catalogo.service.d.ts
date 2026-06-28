import { HttpService } from '@nestjs/axios';
export interface AsentamientoSepomex {
    codigo: string;
    nombre: string;
    tipo: string;
    municipio: string;
    estado: string;
    ciudad?: string;
}
export declare class SepomexCatalogoService {
    private http;
    private readonly logger;
    private readonly url;
    private cache;
    constructor(http: HttpService);
    buscar(query: string, estadoNombre?: string, municipioNombre?: string): Promise<AsentamientoSepomex[]>;
    buscarPorCp(cp: string): Promise<AsentamientoSepomex[]>;
    private cargar;
    private parsear;
    private normalizar;
}
