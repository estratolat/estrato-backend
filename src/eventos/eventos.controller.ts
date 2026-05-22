import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('eventos')
@UseGuards(JwtAuthGuard, TenantGuard)
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  findAll() {
    return this.eventosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventosService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.eventosService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.eventosService.update(id, data);
  }

  @Post(':id/asistencias')
  registrarAsistencia(@Param('id') eventoId: string, @Body() data: any) {
    return this.eventosService.registrarAsistencia(eventoId, data);
  }
}
