import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OpositoresService } from './opositores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CreateOpositorDto } from './dto/create-opositor.dto';
import { UpdateOpositorDto } from './dto/update-opositor.dto';

@ApiTags('Opositores')
@Controller('opositores')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class OpositoresController {
  constructor(private readonly opositoresService: OpositoresService) {}

  @Get()
  @ApiOperation({ summary: 'Listar opositores del tenant' })
  findAll(@Req() req) {
    return this.opositoresService.findAll(req.tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear opositor' })
  create(@Body() dto: CreateOpositorDto, @Req() req) {
    return this.opositoresService.create(req.tenant.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar opositor' })
  update(@Param('id') id: string, @Body() dto: UpdateOpositorDto, @Req() req) {
    return this.opositoresService.update(req.tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar opositor (soft delete)' })
  remove(@Param('id') id: string, @Req() req) {
    return this.opositoresService.remove(req.tenant.id, id);
  }
}
