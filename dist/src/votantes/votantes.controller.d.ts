import { VotantesService } from './votantes.service';
export declare class VotantesController {
    private readonly votantesService;
    constructor(votantesService: VotantesService);
    findAll(query: any): Promise<any>;
    findOne(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
}
