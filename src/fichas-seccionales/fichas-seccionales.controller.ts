import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FichasSeccionalesService } from './fichas-seccionales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Fichas Seccionales')
@Controller('fichas-seccionales')
@UseGuards(JwtAuthGuard, TenantGuard)
export class FichasSeccionalesController {
  constructor(private readonly fichasService: FichasSeccionalesService) {}

  @Get('secciones')
  @ApiOperation({ summary: 'Listar secciones con votantes' })
  secciones(@Req() req: any) {
    return this.fichasService.secciones(req.tenant.id);
  }

  @Get(':seccion')
  @ApiOperation({ summary: 'Ficha completa de una sección' })
  ficha(@Param('seccion') seccion: string, @Req() req: any) {
    return this.fichasService.ficha(seccion, req.tenant.id);
  }

  @Post('comparativa')
  @ApiOperation({ summary: 'Comparar varias secciones' })
  comparativa(@Body('secciones') secciones: string[], @Req() req: any) {
    return this.fichasService.comparativa(secciones, req.tenant.id);
  }
}
