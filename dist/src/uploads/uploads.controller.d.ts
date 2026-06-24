import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    uploadFoto(foto: Express.Multer.File): Promise<{
        foto_url: string;
    }>;
}
