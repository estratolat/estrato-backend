import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MapasService } from './mapas.service';
import { GisParserService } from './gis-parser.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ImportarSeccionesIneDto } from './dto/importar-secciones-ine.dto';
import { BuscarGlobalDto } from './dto/buscar-global.dto';
import { DetalleTerritorialDto } from './dto/detalle-territorial.dto';

@Controller('mapas')
@UseGuards(JwtAuthGuard, TenantGuard)
export class MapasController {
  constructor(
    private readonly mapasService: MapasService,
    private readonly gisParser: GisParserService,
  ) {}

  // Capas personalizadas
  @Get('capas')
  findAllCapas(@Req() req: any) {
    return this.mapasService.findAllCapas(req.tenant.id);
  }

  @Get('capas/:id')
  findOneCapa(@Param('id') id: string, @Req() req: any) {
    return this.mapasService.findOneCapa(id, req.tenant.id);
  }

  @Post('capas')
  createCapa(@Body() data: any, @Req() req: any) {
    return this.mapasService.createCapa(data, req.tenant.id, req.usuario?.id);
  }

  @Patch('capas/:id')
  updateCapa(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.mapasService.updateCapa(id, data, req.tenant.id);
  }

  @Delete('capas/:id')
  removeCapa(@Param('id') id: string, @Req() req: any) {
    return this.mapasService.removeCapa(id, req.tenant.id);
  }

  // GeoJSON por capas
  @Get('geojson')
  geojson(@Query() query: any, @Req() req: any) {
    const capas = query.capas
      ? query.capas.split(',').map((c: string) => c.trim()).filter(Boolean)
      : [];
    return this.mapasService.geojson(req.tenant.id, capas, query);
  }

  // Secciones electorales del INE
  @Get('secciones-ine')
  async findAllSeccionesINE(
    @Query('estado_id') estadoId: string,
    @Query('municipio_id') municipioId: string,
    @Req() req: any,
  ) {
    return this.mapasService.findAllSeccionesINE(
      req.tenant.id,
      estadoId ? Number(estadoId) : undefined,
      municipioId ? Number(municipioId) : undefined,
    );
  }

  @Post('secciones-ine/importar')
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB para shapefiles estatales completos
    fileFilter: (req, file, cb) => {
      const allowed = ['.kml', '.geojson', '.json', '.zip', '.gpx'];
      const ext = file.originalname.toLowerCase();
      const valid = allowed.some(a => ext.endsWith(a));
      cb(valid ? null : new BadRequestException('Solo se permiten KML, GeoJSON, Shapefile (.zip) o GPX'), valid);
    },
  }))
  async importarSeccionesINE(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() body: ImportarSeccionesIneDto,
    @Req() req: any,
  ) {
    if (!archivo) {
      throw new BadRequestException('No se recibió archivo');
    }

    const shapefileHint = body.shapefile_hint;
    const geojson = await this.gisParser.parse(archivo, undefined, shapefileHint);

    return this.mapasService.importarSeccionesINE(
      req.tenant.id,
      req.usuario?.id,
      geojson,
      {
        nombre: body.nombre,
        color: body.color,
        estado_id: Number(body.estado_id),
        estado: body.estado,
        municipio_id: body.municipio_id != null ? Number(body.municipio_id) : undefined,
        municipio: body.municipio,
        anio: body.anio ? Number(body.anio) : undefined,
      },
    );
  }

  // Búsqueda global territorial
  @Get('buscar-global')
  async buscarGlobal(
    @Query() dto: BuscarGlobalDto,
    @Req() req: any,
  ) {
    const limit = dto.limit ? parseInt(dto.limit, 10) : 15;
    return this.mapasService.buscarGlobal(req.tenant.id, dto.q, limit, dto.tipo);
  }

  @Post('buscar-global/detalle')
  async detalleTerritorial(
    @Body() dto: DetalleTerritorialDto,
    @Req() req: any,
  ) {
    return this.mapasService.detalleTerritorial(req.tenant.id, dto);
  }

  // Seed de datos demo para mapa territorial (solo development/demo)
  @Post('seed-demo')
  seedDemo(@Req() req: any) {
    return this.mapasService.seedDemo(req.tenant.id);
  }

  // Subir archivos GIS: KML, GeoJSON, Shapefile
  @Post('subir')
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
      const allowed = ['.kml', '.geojson', '.json', '.zip', '.gpx'];
      const ext = file.originalname.toLowerCase();
      const valid = allowed.some(a => ext.endsWith(a));
      cb(valid ? null : new BadRequestException('Solo se permiten KML, GeoJSON, Shapefile (.zip) o GPX'), valid);
    },
  }))
  async subirArchivo(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    if (!archivo) {
      throw new BadRequestException('No se recibió archivo');
    }

    const tipoArchivo = body.tipo_archivo;
    const shapefileHint = body.shapefile_hint || body.shapefileHint;
    console.log('[subirArchivo] archivo:', archivo.originalname, 'tipo:', tipoArchivo, 'size:', archivo.size, 'mimetype:', archivo.mimetype, 'hint:', shapefileHint);
    const geojson = await this.gisParser.parse(archivo, tipoArchivo, shapefileHint);

    const metadataRaw = body.metadata ? JSON.parse(body.metadata) : {};

    const capa = await this.mapasService.createCapa({
      nombre: body.nombre || archivo.originalname,
      tipo: 'custom',
      origen: 'propia',
      color: body.color || '#D73216',
      visible: body.visible !== 'false',
      geojson,
      metadata: {
        ...metadataRaw,
        archivo_original: archivo.originalname,
        tipo_archivo: tipoArchivo || this.gisParser.detectarTipo(archivo.originalname),
        tamanio_bytes: archivo.size,
        seccion_electoral: body.seccion_electoral || metadataRaw.seccion_electoral || null,
        capa_territorio: metadataRaw.capa_territorio || null,
      },
    }, req.tenant.id, req.usuario?.id);

    return {
      message: 'Archivo procesado y convertido en capa',
      capa,
      features_count: geojson.features?.length || 0,
    };
  }

  // Estadísticas territoriales
  @Get('estadisticas')
  async estadisticas(@Query('nivel') nivel: string, @Req() req: any) {
    try {
      const nivelValido = nivel === 'zona' ? 'zona' : 'seccion';
      return await this.mapasService.estadisticas(req.tenant.id, nivelValido);
    } catch (err: any) {
      console.error('[MapasController.estadisticas] ERROR:', err?.message, err?.stack);
      throw err;
    }
  }
}
