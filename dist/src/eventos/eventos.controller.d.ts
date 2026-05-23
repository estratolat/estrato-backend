import { EventosService } from './eventos.service';
export declare class EventosController {
    private readonly eventosService;
    constructor(eventosService: EventosService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    registrarAsistencia(eventoId: string, data: any): Promise<any>;
}
