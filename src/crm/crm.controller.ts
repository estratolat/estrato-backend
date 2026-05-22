import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('crm')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('mensajes')
  getMensajes(@Query() filters: any) {
    return this.crmService.getMensajes(filters);
  }

  @Post('mensajes')
  enviarMensaje(@Body() data: any) {
    return this.crmService.enviarMensaje(data);
  }

  @Get('stats')
  getStats() {
    return this.crmService.getStats();
  }
}
