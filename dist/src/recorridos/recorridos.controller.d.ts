import { RecorridosService } from './recorridos.service';
export declare class RecorridosController {
    private readonly recorridosService;
    constructor(recorridosService: RecorridosService);
    findAll(): Promise<any>;
    create(data: any): Promise<any>;
}
