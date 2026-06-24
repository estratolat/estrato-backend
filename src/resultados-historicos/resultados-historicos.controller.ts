import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ResultadosHistoricosService } from './resultados-historicos.service';
import { FiltrosResultadosDto } from './dto/filtros-resultados.dto';
import { ImportarResultadosDto } from './dto/importar-resultados.dto';

@Controller('resultados-historicos')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ResultadosHistoricosController {
  constructor(private readonly service: ResultadosHistoricosService) {}

  @Get()
  findAll(@Query() query: FiltrosResultadosDto, @Req() req: any) {
    return this.service.findAll(req.tenant.id, query);
  }

  @Get('resumen')
  resumen(@Req() req: any) {
    return this.service.resumen(req.tenant.id);
  }

  @Post('importar')
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = file.originalname.toLowerCase();
      const valid = ext.endsWith('.csv') || ext.endsWith('.txt');
      cb(valid ? null : new BadRequestException('Solo se permiten archivos CSV o TXT'), valid);
    },
  }))
  async importar(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() body: ImportarResultadosDto,
    @Req() req: any,
  ) {
    return this.service.importar(req.tenant.id, archivo, {
      anio: body.anio,
      estado_id: body.estado_id,
      municipio_id: body.municipio_id,
    });
  }
}
