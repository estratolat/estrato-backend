import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoreoService } from './monitoreo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Monitoreo')
@Controller('monitoreo')
@UseGuards(JwtAuthGuard, TenantGuard)
export class MonitoreoController {
  constructor(private readonly monitoreoService: MonitoreoService) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de casillas reportadas' })
  resumen(@Req() req: any) {
    return this.monitoreoService.resumen(req.tenant.id);
  }

  @Get('por-seccion')
  @ApiOperation({ summary: 'Casillas agrupadas por sección' })
  porSeccion(@Req() req: any) {
    return this.monitoreoService.porSeccion(req.tenant.id);
  }

  @Get('casillas')
  @ApiOperation({ summary: 'Listado de casillas para monitoreo' })
  casillas(@Query() query: any, @Req() req: any) {
    return this.monitoreoService.casillas(query, req.tenant.id);
  }

  @Get('incidencias')
  @ApiOperation({ summary: 'Casillas con incidencias' })
  incidencias(@Req() req: any) {
    return this.monitoreoService.incidencias(req.tenant.id);
  }
}
