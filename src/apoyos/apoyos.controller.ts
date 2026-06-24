import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApoyosService } from './apoyos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('apoyos')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ApoyosController {
  constructor(private readonly apoyosService: ApoyosService) {}

  @Get()
  findAll(@Query() query: any, @Req() req: any) {
    return this.apoyosService.findAll(query, req.tenant.id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.apoyosService.create(data, req.tenant.id, req.usuario?.id);
  }
}
