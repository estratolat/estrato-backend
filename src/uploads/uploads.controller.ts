import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('foto')
  @ApiOperation({ summary: 'Subir foto de evidencia y devolver data URL base64' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('foto', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      cb(allowed.includes(file.mimetype) ? null : new BadRequestException('Solo imágenes JPEG, PNG o WebP'), allowed.includes(file.mimetype));
    },
  }))
  async uploadFoto(@UploadedFile() foto: Express.Multer.File) {
    return {
      foto_url: this.uploadsService.toBase64DataUrl(foto),
    };
  }
}
