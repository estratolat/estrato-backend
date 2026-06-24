import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ZonasService } from './zonas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('zonas')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ZonasController {
  constructor(private readonly zonasService: ZonasService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.zonasService.findAll(req.tenant.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.zonasService.findOne(id, req.tenant.id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.zonasService.create(data, req.tenant.id, req.usuario?.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.zonasService.update(id, data, req.tenant.id, req.usuario?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.zonasService.remove(id, req.tenant.id);
  }
}
