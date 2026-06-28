import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EncuestasService } from './encuestas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Encuestas')
@Controller('encuestas')
@UseGuards(JwtAuthGuard, TenantGuard)
export class EncuestasController {
  constructor(private readonly encuestasService: EncuestasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar encuestas del tenant' })
  findAll(@Query() query: any, @Req() req: any) {
    return this.encuestasService.findAll(query, req.tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de una encuesta' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.encuestasService.findOne(id, req.tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear encuesta' })
  create(@Body() data: any, @Req() req: any) {
    return this.encuestasService.create(data, req.tenant.id, req.usuario?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar encuesta' })
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.encuestasService.update(id, data, req.tenant.id);
  }

  @Patch(':id/estatus')
  @ApiOperation({ summary: 'Cambiar estatus de encuesta' })
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.encuestasService.updateStatus(id, status, req.tenant.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar encuesta y sus respuestas' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.encuestasService.remove(id, req.tenant.id);
  }

  @Post(':id/respuestas')
  @ApiOperation({ summary: 'Registrar respuesta a una encuesta' })
  createRespuesta(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.encuestasService.createRespuesta(id, data, req.tenant.id, req.usuario?.id);
  }

  @Get(':id/respuestas')
  @ApiOperation({ summary: 'Listar respuestas de una encuesta' })
  findRespuestas(@Param('id') id: string, @Query() query: any, @Req() req: any) {
    return this.encuestasService.findRespuestas(id, query, req.tenant.id);
  }

  @Get(':id/resumen')
  @ApiOperation({ summary: 'Resumen agregado de respuestas' })
  resumen(@Param('id') id: string, @Req() req: any) {
    return this.encuestasService.resumen(id, req.tenant.id);
  }
}
