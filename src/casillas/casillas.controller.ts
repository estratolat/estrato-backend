import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CasillasService } from './casillas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Casillas')
@Controller('casillas')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CasillasController {
  constructor(private readonly casillasService: CasillasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar casillas del tenant' })
  findAll(@Query() query: any, @Req() req: any) {
    return this.casillasService.findAll(query, req.tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver casilla' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.casillasService.findOne(id, req.tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear casilla' })
  create(@Body() data: any, @Req() req: any) {
    return this.casillasService.create(data, req.tenant.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar casilla' })
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.casillasService.update(id, data, req.tenant.id);
  }

  @Patch(':id/estatus')
  @ApiOperation({ summary: 'Cambiar estatus de casilla' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('incidencia') incidencia: string,
    @Req() req: any,
  ) {
    return this.casillasService.updateStatus(id, status, incidencia, req.tenant.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar casilla' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.casillasService.remove(id, req.tenant.id);
  }

  @Post('importar')
  @ApiOperation({ summary: 'Importar casillas masivamente' })
  importar(@Body() body: { casillas: any[] }, @Req() req: any) {
    return this.casillasService.importar(body.casillas || [], req.tenant.id);
  }
}
