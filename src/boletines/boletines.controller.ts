import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { BoletinesService } from './boletines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CreateBoletinDto } from './dto/create-boletin.dto';
import { GenerarBoletinDto } from './dto/generar-boletin.dto';

interface RequestConTenant extends Request {
  tenant: { id: string };
  usuario: { id: string };
}

@Controller('boletines')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BoletinesController {
  constructor(private readonly boletinesService: BoletinesService) {}

  @Get()
  findAll(@Req() req: RequestConTenant) {
    return this.boletinesService.findAll(req.tenant.id);
  }

  @Post()
  create(
    @Body() data: CreateBoletinDto,
    @Req() req: RequestConTenant,
  ) {
    return this.boletinesService.create(req.tenant.id, req.usuario.id, data);
  }

  @Post('generar')
  generar(
    @Body() data: GenerarBoletinDto,
    @Req() req: RequestConTenant,
  ) {
    return this.boletinesService.generar(req.tenant.id, req.usuario.id, data);
  }

  @Patch(':id/aprobar')
  aprobar(
    @Param('id') id: string,
    @Req() req: RequestConTenant,
  ) {
    return this.boletinesService.aprobar(id, req.tenant.id, req.usuario.id);
  }

  @Patch(':id/rechazar')
  rechazar(
    @Param('id') id: string,
    @Req() req: RequestConTenant,
  ) {
    return this.boletinesService.rechazar(id, req.tenant.id);
  }
}
