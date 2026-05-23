import { LideresService } from './lideres.service';
export declare class LideresController {
    private readonly lideresService;
    constructor(lideresService: LideresService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(data: any): Promise<any>;
    updateScore(id: string, score: number): Promise<any>;
}
