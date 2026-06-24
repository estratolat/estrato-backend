import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { VotantesService } from './votantes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('votantes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class VotantesController {
  constructor(private readonly votantesService: VotantesService) {}

  @Get()
  async findAll(@Query() query: any, @Req() req: any) {
    try {
      return await this.votantesService.findAll(query, req.tenant.id);
    } catch (err: any) {
      console.error('[VotantesController.findAll] ERROR:', err?.message, err?.stack);
      throw err;
    }
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    try {
      return await this.votantesService.getStats(req.tenant.id);
    } catch (err: any) {
      console.error('[VotantesController.getStats] ERROR:', err?.message, err?.stack);
      throw err;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.votantesService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.votantesService.create(data, req.tenant.id);
  }

  @Post('importar')
  importar(@Body() body: { votantes: any[] }, @Req() req: any) {
    return this.votantesService.importar(body.votantes || [], req.tenant.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.votantesService.update(id, data);
  }
}
