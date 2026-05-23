import { BoletinesService } from './boletines.service';
export declare class BoletinesController {
    private readonly boletinesService;
    constructor(boletinesService: BoletinesService);
    findAll(): Promise<any>;
    create(data: any): Promise<any>;
    aprobar(id: string): Promise<any>;
    rechazar(id: string): Promise<any>;
}
