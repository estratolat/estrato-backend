import { Controller, Get, Post, Body, Query, UseGuards, Req, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { Request } from 'express';
import { ColoniasService, ResultadoColonia } from './colonias.service';
import { MapasService } from '../mapas/mapas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

interface RequestConTenant extends Request {
  tenant: { id: string };
  usuario: { id: string };
}

class BuscarColoniaDto {
  @IsString()
  q: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  municipio?: string;
}

class ImportarColoniaDto {
  @IsString()
  id: string;

  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  municipio?: string;

  @IsString()
  @IsOptional()
  codigo_postal?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

@Controller('colonias')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ColoniasController {
  private readonly logger = new Logger(ColoniasController.name);

  constructor(
    private readonly coloniasService: ColoniasService,
    private readonly mapasService: MapasService,
  ) {}

  @Get('buscar')
  async buscar(@Query() dto: BuscarColoniaDto) {
    return this.coloniasService.buscar(dto.q, dto.estado, dto.municipio);
  }

  @Post('importar')
  async importar(
    @Body() dto: ImportarColoniaDto,
    @Req() req: RequestConTenant,
  ) {
    this.logger.log(`Importando colonia: id=${dto.id}, nombre=${dto.nombre}, tenant=${req.tenant.id}`);

    try {
      const [fuente, ...resto] = dto.id.split('_');
      if (!['sepomex', 'nominatim'].includes(fuente)) {
        throw new BadRequestException('ID de colonia inválido');
      }

      let colonia: ResultadoColonia | null = null;

      if (fuente === 'sepomex') {
        const estadoId = resto[0];
        if (!estadoId) {
          throw new BadRequestException('ID de colonia inválido');
        }
        colonia = await this.coloniasService.obtenerPorId(estadoId, dto.id);
      } else if (fuente === 'nominatim') {
        colonia = await this.coloniasService.obtenerPorIdNominatim(dto.id);
      } else if (fuente === 'inegi' && resto[0] === 'ageb') {
        colonia = await this.coloniasService.obtenerPorIdAgeb(dto.id);
      }

      if (!colonia || !colonia.geojson) {
        throw new BadRequestException('No se encontró el polígono de la colonia');
      }

      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: colonia.geojson,
            properties: {
              nombre: dto.nombre,
              codigo_postal: dto.codigo_postal || colonia.codigo_postal,
              municipio: dto.municipio || colonia.municipio,
              estado: colonia.estado,
              fuente,
              osm_id: dto.id,
              aproximado: colonia.aproximado || false,
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
          fuente,
          osm_id: dto.id,
          codigo_postal: dto.codigo_postal || colonia.codigo_postal,
          municipio: dto.municipio || colonia.municipio,
          estado: colonia.estado,
          aproximado: colonia.aproximado || false,
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
