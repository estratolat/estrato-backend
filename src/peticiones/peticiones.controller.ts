import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PeticionesService } from './peticiones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Peticiones')
@Controller('peticiones')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PeticionesController {
  constructor(private readonly peticionesService: PeticionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar peticiones ciudadanas del tenant' })
  findAll(@Query() query: any, @Req() req: any) {
    return this.peticionesService.findAll(query, req.tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva petición ciudadana' })
  create(@Body() data: any, @Req() req: any) {
    return this.peticionesService.create(data, req.tenant.id, req.usuario?.id);
  }

  @Patch(':id/estatus')
  @ApiOperation({ summary: 'Actualizar estatus de una petición' })
  updateEstatus(
    @Param('id') id: string,
    @Body('estatus') estatus: string,
    @Req() req: any,
  ) {
    return this.peticionesService.updateEstatus(id, estatus, req.tenant.id);
  }
}
