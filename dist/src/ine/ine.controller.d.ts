import { IneService } from './ine.service';
export declare class IneController {
    private readonly ineService;
    constructor(ineService: IneService);
    getBitacora(): Promise<any>;
    registrar(data: any): Promise<any>;
}
