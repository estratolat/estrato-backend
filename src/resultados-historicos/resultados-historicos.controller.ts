import {
  Controller,
  Get,
  Post,
  Delete,
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
import { ImportarResultadosDto, PreviewResultadosDto } from './dto/importar-resultados.dto';

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

  @Get('tipos')
  tipos() {
    return {
      tipos_historico: ['principal', 'complementario'],
      tipos_eleccion: [
        'ayuntamiento',
        'diputado_local',
        'diputado_federal',
        'senador',
        'gobernador',
        'presidente_republica',
      ],
    };
  }

  @Post('preview-raw')
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = file.originalname.toLowerCase();
      const valid = ext.endsWith('.csv') || ext.endsWith('.txt');
      cb(valid ? null : new BadRequestException('Solo se permiten archivos CSV o TXT'), valid);
    },
  }))
  async previewRaw(
    @UploadedFile() archivo: Express.Multer.File,
    @Req() req: any,
  ): Promise<any> {
    return this.service.previewRaw(archivo);
  }

  @Post('preview')
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = file.originalname.toLowerCase();
      const valid = ext.endsWith('.csv') || ext.endsWith('.txt');
      cb(valid ? null : new BadRequestException('Solo se permiten archivos CSV o TXT'), valid);
    },
  }))
  async preview(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() body: PreviewResultadosDto,
    @Req() req: any,
  ): Promise<any> {
    const dto = body as unknown as ImportarResultadosDto;
    const preview = await this.service.preview(req.tenant.id, archivo, dto);

    // Si no hay mapeo completo, devolvemos también la fila de encabezado detectada
    // y una sugerencia de mapeo automático para que el frontend pueda pre-llenar todo.
    const soloColumnas = !dto.mapeo?.seccion || !dto.mapeo?.casilla;
    if (soloColumnas) {
      const detectado = this.service.detectarFilaEncabezado(archivo);
      const sugerencia = detectado ? this.service.sugerirMapeo(detectado.columnas) : null;
      return { ...preview, encabezadoDetectado: detectado, sugerenciaMapeo: sugerencia };
    }

    return { ...preview, modoSabana: dto.mapeo?.seccion && dto.mapeo?.casilla && !dto.actores?.length };
  }

  @Post('sugerir-mapeo')
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = file.originalname.toLowerCase();
      const valid = ext.endsWith('.csv') || ext.endsWith('.txt');
      cb(valid ? null : new BadRequestException('Solo se permiten archivos CSV o TXT'), valid);
    },
  }))
  async sugerirMapeo(
    @UploadedFile() archivo: Express.Multer.File,
    @Req() req: any,
  ): Promise<any> {
    const detectado = this.service.detectarFilaEncabezado(archivo);
    if (!detectado) throw new BadRequestException('No se pudo detectar el encabezado del archivo');
    return {
      fila: detectado.fila,
      columnas: detectado.columnas,
      sugerencia: this.service.sugerirMapeo(detectado.columnas),
    };
  }

  @Post('importar')
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = file.originalname.toLowerCase();
      const valid = ext.endsWith('.csv') || ext.endsWith('.txt');
      cb(valid ? null : new BadRequestException('Solo se permiten archivos CSV o TXT'), valid);
    },
  }))
  async importar(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() body: PreviewResultadosDto,
    @Req() req: any,
  ): Promise<any> {
    const dto = body as unknown as ImportarResultadosDto;
    return this.service.importar(req.tenant.id, archivo, dto);
  }

  private parsearBodyImportacion(body: ImportarResultadosDto): ImportarResultadosDto {
    const dto = { ...body } as ImportarResultadosDto;
    try {
      if (typeof body.mapeo === 'string') {
        dto.mapeo = JSON.parse(body.mapeo);
      }
      if (typeof body.actores === 'string') {
        dto.actores = JSON.parse(body.actores);
      }
    } catch (err) {
      throw new BadRequestException('El mapeo o los actores no son un JSON válido');
    }
    return dto;
  }

  @Delete('lote')
  async eliminarLote(
    @Body() body: {
      tipo_historico: string;
      tipo_eleccion: string;
      anio: number;
      estado_id?: number;
      municipio_id?: number;
    },
    @Req() req: any,
  ) {
    return this.service.eliminarLote(req.tenant.id, body);
  }
}
