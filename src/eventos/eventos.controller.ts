import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req, Delete } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('eventos')
@UseGuards(JwtAuthGuard, TenantGuard)
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  findAll(@Query() query: any, @Req() req: any) {
    return this.eventosService.findAll(query, req.tenant.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.eventosService.findOne(id, req.tenant.id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.eventosService.create(data, req.tenant.id, req.usuario?.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.eventosService.update(id, data, req.tenant.id);
  }

  @Post(':id/asistencias')
  registrarAsistencia(
    @Param('id') eventoId: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.eventosService.registrarAsistencia(eventoId, data, req.tenant.id);
  }

  @Delete(':id/asistencias/:votanteId')
  eliminarAsistencia(
    @Param('id') eventoId: string,
    @Param('votanteId') votanteId: string,
    @Req() req: any,
  ) {
    return this.eventosService.eliminarAsistencia(eventoId, votanteId, req.tenant.id);
  }
}
