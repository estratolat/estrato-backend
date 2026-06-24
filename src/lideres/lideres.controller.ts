import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, Req, Query } from '@nestjs/common';
import { LideresService } from './lideres.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('lideres')
@UseGuards(JwtAuthGuard, TenantGuard)
export class LideresController {
  constructor(private readonly lideresService: LideresService) {}

  @Get()
  findAll(@Req() req: any, @Query() query: any) {
    const filtros = {
      padres: query.padres === 'true' ? true : undefined,
      scoreMin: query.score_min ? parseFloat(query.score_min) : undefined,
      zonaId: query.zona_id || undefined,
      sinCoordenadas:
        query.sin_coordenadas === 'true'
          ? true
          : query.sin_coordenadas === 'false'
          ? false
          : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    };
    return this.lideresService.findAll(req.tenant.id, filtros);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.lideresService.findOne(id, req.tenant.id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.lideresService.create(data, req.tenant.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.lideresService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lideresService.delete(id);
  }

  @Patch(':id/score')
  updateScore(@Param('id') id: string, @Body('score') score: number) {
    return this.lideresService.updateScore(id, score);
  }

  @Get('stats/resumen')
  stats(@Req() req: any) {
    return this.lideresService.getStats(req.tenant.id);
  }

  @Get('geojson/influencia')
  geojsonInfluencia(@Query('radio_m') radio: string, @Req() req: any) {
    const radioM = Math.min(Math.max(parseInt(radio || '500', 10), 100), 5000);
    return this.lideresService.geojsonInfluencia(req.tenant.id, radioM);
  }
}
