import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { BoletinesService } from './boletines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('boletines')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BoletinesController {
  constructor(private readonly boletinesService: BoletinesService) {}

  @Get()
  findAll() {
    return this.boletinesService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.boletinesService.create(data);
  }

  @Patch(':id/aprobar')
  aprobar(@Param('id') id: string) {
    return this.boletinesService.aprobar(id);
  }

  @Patch(':id/rechazar')
  rechazar(@Param('id') id: string) {
    return this.boletinesService.rechazar(id);
  }
}
