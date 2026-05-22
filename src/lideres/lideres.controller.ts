import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { LideresService } from './lideres.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('lideres')
@UseGuards(JwtAuthGuard, TenantGuard)
export class LideresController {
  constructor(private readonly lideresService: LideresService) {}

  @Get()
  findAll() {
    return this.lideresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lideresService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.lideresService.create(data);
  }

  @Patch(':id/score')
  updateScore(@Param('id') id: string, @Body('score') score: number) {
    return this.lideresService.updateScore(id, score);
  }
}
