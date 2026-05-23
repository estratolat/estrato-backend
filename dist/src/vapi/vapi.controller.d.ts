import { VapiService } from './vapi.service';
export declare class VapiController {
    private readonly vapiService;
    constructor(vapiService: VapiService);
    getCampanas(): Promise<any>;
    createCampana(data: any): Promise<any>;
    getLlamadas(campanaId: string): Promise<any>;
}
