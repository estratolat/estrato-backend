import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UploadsService {
  toBase64DataUrl(file: Express.Multer.File): string {
    if (!file || !file.buffer) {
      throw new BadRequestException('No se recibió archivo');
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPEG, PNG o WebP');
    }

    // Límite aproximado 5 MB (base64 aumenta ~33%)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('La imagen no debe exceder 5 MB');
    }

    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  }
}
