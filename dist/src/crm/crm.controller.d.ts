import { CrmService } from './crm.service';
export declare class CrmController {
    private readonly crmService;
    constructor(crmService: CrmService);
    getMensajes(filters: any): Promise<any>;
    enviarMensaje(data: any): Promise<any>;
    getStats(): Promise<{
        total: any;
        pendientes: any;
    }>;
}
