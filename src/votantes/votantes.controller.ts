import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { VotantesService } from './votantes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('votantes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class VotantesController {
  constructor(private readonly votantesService: VotantesService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.votantesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.votantesService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.votantesService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.votantesService.update(id, data);
  }
}
