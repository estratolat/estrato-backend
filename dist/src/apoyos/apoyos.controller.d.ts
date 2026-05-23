import { ApoyosService } from './apoyos.service';
export declare class ApoyosController {
    private readonly apoyosService;
    constructor(apoyosService: ApoyosService);
    findAll(query: any): Promise<any>;
    create(data: any): Promise<any>;
}
