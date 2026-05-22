import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { VapiService } from './vapi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('vapi')
@UseGuards(JwtAuthGuard, TenantGuard)
export class VapiController {
  constructor(private readonly vapiService: VapiService) {}

  @Get('campanas')
  getCampanas() {
    return this.vapiService.getCampanas();
  }

  @Post('campanas')
  createCampana(@Body() data: any) {
    return this.vapiService.createCampana(data);
  }

  @Get('campanas/:id/llamadas')
  getLlamadas(@Param('id') campanaId: string) {
    return this.vapiService.getLlamadas(campanaId);
  }
}
