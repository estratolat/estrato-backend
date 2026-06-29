import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ParseUUIDPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { InteligenciaElectoralService } from './inteligencia-electoral.service';
import { CrearPartidoDto, ActualizarPartidoDto } from './dto/crear-partido.dto';
import { CrearEleccionDto, ActualizarEleccionDto } from './dto/crear-eleccion.dto';
import { CrearActorDto, ActualizarActorDto } from './dto/crear-actor.dto';
import { ConsultaIADto } from './dto/consulta-ia.dto';

@Controller('inteligencia-electoral')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InteligenciaElectoralController {
  constructor(private readonly service: InteligenciaElectoralService) {}

  // =====================
  // PARTIDOS
  // =====================
  @Get('partidos')
  findAllPartidos(@Req() req: any) {
    return this.service.findAllPartidos(req.tenant.id);
  }

  @Post('partidos')
  createPartido(@Body() dto: CrearPartidoDto, @Req() req: any) {
    return this.service.createPartido(req.tenant.id, dto);
  }

  @Patch('partidos/:id')
  updatePartido(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarPartidoDto,
    @Req() req: any,
  ) {
    return this.service.updatePartido(req.tenant.id, id, dto);
  }

  @Delete('partidos/:id')
  deletePartido(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.deletePartido(req.tenant.id, id);
  }

  // =====================
  // ELECCIONES
  // =====================
  @Get('elecciones')
  findAllElecciones(
    @Query('activas', new DefaultValuePipe(true), ParseBoolPipe) activas: boolean,
    @Req() req: any,
  ) {
    return this.service.findAllElecciones(req.tenant.id, activas);
  }

  @Get('elecciones/:id')
  findOneEleccion(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.findOneEleccion(req.tenant.id, id);
  }

  @Post('elecciones')
  createEleccion(@Body() dto: CrearEleccionDto, @Req() req: any) {
    return this.service.createEleccion(req.tenant.id, dto);
  }

  @Patch('elecciones/:id')
  updateEleccion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEleccionDto,
    @Req() req: any,
  ) {
    return this.service.updateEleccion(req.tenant.id, id, dto);
  }

  @Delete('elecciones/:id')
  deleteEleccion(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.deleteEleccion(req.tenant.id, id);
  }

  // =====================
  // ACTORES / COALICIONES
  // =====================
  @Get('elecciones/:id/actores')
  findActores(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.service.findActoresByEleccion(req.tenant.id, id);
  }

  @Post('elecciones/:id/actores')
  createActor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearActorDto,
    @Req() req: any,
  ) {
    return this.service.createActor(req.tenant.id, id, dto);
  }

  @Patch('actores/:id')
  updateActor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarActorDto,
    @Req() req: any,
  ) {
    return this.service.updateActor(req.tenant.id, id, dto);
  }

  @Delete('actores/:id')
  deleteActor(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.deleteActor(req.tenant.id, id);
  }

  // =====================
  // PLANTILLA EXCEL
  // =====================
  @Get('elecciones/:id/plantilla')
  async descargarPlantilla(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.service.generarPlantilla(req.tenant.id, id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('elecciones/:id/sabana')
  async descargarSabana(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.service.generarSabana(req.tenant.id, id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // =====================
  // CARGA MASIVA EXCEL
  // =====================
  @Post('elecciones/:id/cargar-excel')
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const name = file.originalname.toLowerCase();
      const valid = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');
      cb(valid ? null : new BadRequestException('Solo se permiten archivos Excel o CSV'), valid);
    },
  }))
  async cargarExcel(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() archivo: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.service.cargarExcel(req.tenant.id, id, archivo);
  }

  // =====================
  // SECCIONES AGREGADAS
  // =====================
  @Get('elecciones/:id/secciones')
  getSecciones(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.service.getSecciones(req.tenant.id, id);
  }

  // =====================
  // MAPA DE SECCIONES COLOREADO POR GANADOR
  // =====================
  @Get('elecciones/:id/mapa-secciones')
  getMapaSecciones(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.service.generarMapaSecciones(req.tenant.id, id);
  }

  // =====================
  // ANÁLISIS CON IA (ANTHROPIC)
  // =====================
  @Post('elecciones/:id/analizar-seccion/:seccion')
  async analizarSeccion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('seccion') seccion: string,
    @Req() req: any,
  ) {
    return this.service.analizarSeccion(req.tenant.id, id, seccion);
  }

  // =====================
  // CONSULTOR IA (PROMPT LIBRE + CONTEXTO DE CAMPAÑA)
  // =====================
  @Post('consultar-ia')
  async consultarIA(@Body() dto: ConsultaIADto, @Req() req: any) {
    return this.service.consultarIA(req.tenant.id, dto);
  }
}
