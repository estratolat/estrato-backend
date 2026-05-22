import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RecorridosService } from './recorridos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('recorridos')
@UseGuards(JwtAuthGuard, TenantGuard)
export class RecorridosController {
  constructor(private readonly recorridosService: RecorridosService) {}

  @Get()
  findAll() {
    return this.recorridosService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.recorridosService.create(data);
  }
}
