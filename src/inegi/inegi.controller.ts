import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Res, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { Request, Response } from 'express';
import { InegiService, TipoCapaInegi } from './inegi.service';
import { InegiWmsService, CapaInegiWms } from './inegi-wms.service';
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

@Controller('inegi')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InegiController {
  private readonly logger = new Logger(InegiController.name);

  constructor(
    private readonly inegiService: InegiService,
    private readonly inegiWmsService: InegiWmsService,
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
  ) {
    return this.inegiWmsService.proxyTile(
      { capa, bbox, width, height, srs, version, format, styles, cve, transparent },
      res,
    );
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
}
