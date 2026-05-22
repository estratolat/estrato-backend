import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IneService } from './ine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('ine')
@UseGuards(JwtAuthGuard, TenantGuard)
export class IneController {
  constructor(private readonly ineService: IneService) {}

  @Get('bitacora')
  getBitacora() {
    return this.ineService.getBitacora();
  }

  @Post('bitacora')
  registrar(@Body() data: any) {
    return this.ineService.registrar(data);
  }
}
