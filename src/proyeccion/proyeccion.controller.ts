import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProyeccionService } from './proyeccion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Proyección')
@Controller('proyeccion')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProyeccionController {
  constructor(private readonly proyeccionService: ProyeccionService) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen global de proyección' })
  resumen(@Req() req: any) {
    return this.proyeccionService.resumen(req.tenant.id);
  }

  @Get('secciones')
  @ApiOperation({ summary: 'Proyección por sección' })
  secciones(@Req() req: any) {
    return this.proyeccionService.porSeccion(req.tenant.id);
  }

  @Get('metas')
  @ApiOperation({ summary: 'Listar metas de votación' })
  findMetas(@Query() query: any, @Req() req: any) {
    return this.proyeccionService.findMetas(query, req.tenant.id);
  }

  @Post('metas')
  @ApiOperation({ summary: 'Crear meta de votación' })
  createMeta(@Body() data: any, @Req() req: any) {
    return this.proyeccionService.createMeta(data, req.tenant.id);
  }

  @Patch('metas/:id')
  @ApiOperation({ summary: 'Actualizar meta' })
  updateMeta(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.proyeccionService.updateMeta(id, data, req.tenant.id);
  }

  @Delete('metas/:id')
  @ApiOperation({ summary: 'Eliminar meta' })
  removeMeta(@Param('id') id: string, @Req() req: any) {
    return this.proyeccionService.removeMeta(id, req.tenant.id);
  }
}
