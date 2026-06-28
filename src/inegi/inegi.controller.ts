import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Res, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { Request, Response } from 'express';
import { InegiService, TipoCapaInegi } from './inegi.service';
import { InegiWmsService, CapaInegiWms } from './inegi-wms.service';
import { NominatimService } from './nominatim.service';
import { MapasService } from '../mapas/mapas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

interface RequestConTenant extends Request {
  tenant: { id: string };
  usuario: { id: string };
}

class DescargarDto {
  @IsIn(['estados', 'municipios', 'localidades', 'ageb', 'manzanas', 'vialidades'])
  tipo: TipoCapaInegi;

  @IsString()
  @IsOptional()
  clave?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

class BuscarDto {
  @IsIn(['estados', 'municipios', 'localidades', 'ageb', 'manzanas', 'vialidades'])
  tipo: TipoCapaInegi;

  @IsString()
  q: string;

  @IsString()
  @IsOptional()
  ent?: string;

  @IsString()
  @IsOptional()
  mun?: string;

  @IsString()
  @IsOptional()
  loc?: string;
}

class ImportarPorClaveDto {
  @IsIn(['estados', 'municipios', 'localidades', 'ageb', 'manzanas', 'vialidades'])
  tipo: TipoCapaInegi;

  @IsString()
  clave: string;

  @IsString()
  @IsOptional()
  ent?: string;

  @IsString()
  @IsOptional()
  mun?: string;

  @IsString()
  @IsOptional()
  loc?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

class BuscarColoniaDto {
  @IsString()
  q: string;

  @IsString()
  @IsOptional()
  ent?: string;

  @IsString()
  @IsOptional()
  mun?: string;
}

class ImportarColoniaDto {
  @IsString()
  id: string;

  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  ent?: string;

  @IsString()
  @IsOptional()
  mun?: string;
}

@Controller('inegi')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InegiController {
  private readonly logger = new Logger(InegiController.name);

  constructor(
    private readonly inegiService: InegiService,
    private readonly inegiWmsService: InegiWmsService,
    private readonly nominatimService: NominatimService,
    private readonly mapasService: MapasService,
  ) {}

  @Get('wms')
  async proxyWms(
    @Res() res: Response,
    @Query('capa') capa: CapaInegiWms,
    @Query('bbox') bbox: string,
    @Query('width') width: string,
    @Query('height') height: string,
    @Query('srs') srs?: string,
    @Query('version') version?: string,
    @Query('format') format?: string,
    @Query('styles') styles?: string,
    @Query('cve') cve?: string,
    @Query('transparent') transparent?: string,
    @Query('indicador') indicador?: string,
  ) {
    return this.inegiWmsService.proxyTile(
      { capa, bbox, width, height, srs, version, format, styles, cve, transparent, indicador },
      res,
    );
  }

  @Get('buscar')
  async buscar(@Query() dto: BuscarDto) {
    return this.inegiService.buscar(dto.tipo, dto.q, dto.ent, dto.mun, dto.loc);
  }

  @Get('buscar-colonia')
  async buscarColonia(@Query() dto: BuscarColoniaDto) {
    return this.nominatimService.buscar(dto.q, dto.ent, dto.mun);
  }

  @Get(':tipo')
  async descargar(
    @Param('tipo') tipo: TipoCapaInegi,
    @Query('clave') clave?: string,
  ) {
    return this.inegiService.descargar(tipo, clave);
  }

  @Post('importar')
  async importar(
    @Body() dto: DescargarDto,
    @Req() req: RequestConTenant,
  ) {
    this.logger.log(`Importando INEGI: tipo=${dto.tipo}, clave=${dto.clave}, tenant=${req.tenant.id}`);

    try {
      const geojson = await this.inegiService.descargar(dto.tipo, dto.clave);
      const featureCount = geojson?.features?.length || 0;
      this.logger.log(`INEGI descargado: ${featureCount} features para tipo=${dto.tipo}, clave=${dto.clave}`);

      const nombre = dto.nombre || `INEGI ${dto.tipo}${dto.clave ? ` ${dto.clave}` : ''}`;

      const capa = await this.mapasService.createCapa({
        nombre,
        tipo: 'inegi',
        origen: 'externa',
        color: dto.color || '#6B7280',
        visible: true,
        geojson,
        metadata: {
          fuente: 'inegi',
          tipo_inegi: dto.tipo,
          clave: dto.clave,
        },
      }, req.tenant.id, req.usuario.id);

      this.logger.log(`Capa INEGI guardada: id=${capa.id}, nombre=${capa.nombre}`);

      return {
        capa,
        features: featureCount,
      };
    } catch (err: any) {
      this.logger.error(
        `Error importando INEGI tipo=${dto.tipo}, clave=${dto.clave}: ${err?.message}`,
        err?.stack,
      );

      // Si ya es una excepción controlada, dejarla pasar para que el filtro global la formatee limpio
      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException('No se pudo guardar la capa del INEGI. Revisa los logs del servidor.');
    }
  }

  @Post('importar-por-clave')
  async importarPorClave(
    @Body() dto: ImportarPorClaveDto,
    @Req() req: RequestConTenant,
  ) {
    this.logger.log(`Importando INEGI por clave: tipo=${dto.tipo}, clave=${dto.clave}, tenant=${req.tenant.id}`);

    try {
      const geojson = await this.inegiService.obtenerPorClave(
        dto.tipo,
        dto.clave,
        dto.ent,
        dto.mun,
        dto.loc,
      );
      const featureCount = geojson?.features?.length || 0;

      const nombre = dto.nombre || `INEGI ${dto.tipo} ${dto.clave}`;

      const capa = await this.mapasService.createCapa({
        nombre,
        tipo: 'inegi',
        origen: 'externa',
        color: dto.color || '#6B7280',
        visible: true,
        geojson,
        metadata: {
          fuente: 'inegi',
          tipo_inegi: dto.tipo,
          clave: dto.clave,
          entidad: dto.ent,
          municipio: dto.mun,
          localidad: dto.loc,
        },
      }, req.tenant.id, req.usuario.id);

      this.logger.log(`Capa INEGI guardada: id=${capa.id}, nombre=${capa.nombre}`);

      return {
        capa,
        features: featureCount,
      };
    } catch (err: any) {
      this.logger.error(
        `Error importando INEGI por clave tipo=${dto.tipo}, clave=${dto.clave}: ${err?.message}`,
        err?.stack,
      );

      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException('No se pudo guardar la capa del INEGI. Revisa los logs del servidor.');
    }
  }

  @Post('importar-colonia')
  async importarColonia(
    @Body() dto: ImportarColoniaDto,
    @Req() req: RequestConTenant,
  ) {
    this.logger.log(`Importando colonia desde Nominatim: id=${dto.id}, nombre=${dto.nombre}, tenant=${req.tenant.id}`);

    try {
      // Reutilizar buscador para obtener el geojson actual
      const resultados = await this.nominatimService.buscar(
        dto.nombre,
        dto.ent,
        dto.mun,
      );
      const seleccionado = resultados.find((r) => r.id === dto.id);

      if (!seleccionado || !seleccionado.geojson) {
        throw new BadRequestException('No se encontró el polígono de la colonia seleccionada');
      }

      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: seleccionado.geojson,
            properties: {
              nombre: dto.nombre,
              direccion: dto.direccion || seleccionado.direccion,
              fuente: 'nominatim',
              osm_id: dto.id,
            },
          },
        ],
      };

      const capa = await this.mapasService.createCapa({
        nombre: dto.nombre,
        tipo: 'colonia',
        origen: 'externa',
        color: dto.color || '#D73216',
        visible: true,
        geojson,
        metadata: {
          fuente: 'nominatim',
          osm_id: dto.id,
          direccion: dto.direccion || seleccionado.direccion,
          entidad: dto.ent,
          municipio: dto.mun,
        },
      }, req.tenant.id, req.usuario.id);

      this.logger.log(`Colonia guardada: id=${capa.id}, nombre=${capa.nombre}`);

      return { capa };
    } catch (err: any) {
      this.logger.error(
        `Error importando colonia id=${dto.id}: ${err?.message}`,
        err?.stack,
      );

      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException('No se pudo guardar la colonia. Revisa los logs del servidor.');
    }
  }
}
