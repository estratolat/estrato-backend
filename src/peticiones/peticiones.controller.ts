import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PeticionesService, PeticionQuery } from './peticiones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CreatePeticionDto } from './dto/create-peticion.dto';
import { UpdatePeticionDto } from './dto/update-peticion.dto';
import { UpdateEstatusDto } from './dto/update-estatus.dto';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';

@ApiTags('Peticiones')
@Controller('peticiones')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class PeticionesController {
  constructor(private readonly peticionesService: PeticionesService) {}

  private getUserContext(req: any) {
    return {
      id: req.usuario?.id || req.user?.userId,
      rol: req.usuario?.rol || req.user?.rol,
      zona_id: req.usuario?.zona_id || req.user?.zona_id || null,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar peticiones del tenant con filtros y aislamiento por rol' })
  findAll(@Query() query: PeticionQuery, @Req() req: any) {
    return this.peticionesService.findAll(query, req.tenant.id, this.getUserContext(req));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una petición' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.peticionesService.findOne(id, req.tenant.id, this.getUserContext(req));
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva petición o propuesta' })
  create(@Body() data: CreatePeticionDto, @Req() req: any) {
    return this.peticionesService.create(
      data,
      req.tenant.id,
      req.usuario?.id || req.user?.userId,
      req.usuario?.rol || req.user?.rol,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de una petición' })
  update(
    @Param('id') id: string,
    @Body() data: UpdatePeticionDto,
    @Req() req: any,
  ) {
    return this.peticionesService.update(id, data, req.tenant.id, this.getUserContext(req));
  }

  @Patch(':id/estatus')
  @ApiOperation({ summary: 'Actualizar estatus de una petición' })
  updateEstatus(
    @Param('id') id: string,
    @Body() dto: UpdateEstatusDto,
    @Req() req: any,
  ) {
    return this.peticionesService.updateEstatus(
      id,
      dto.estatus,
      req.tenant.id,
      this.getUserContext(req),
      dto.comentario,
    );
  }

  @Post(':id/evidencias')
  @ApiOperation({ summary: 'Agregar evidencia fotográfica a una petición' })
  addEvidencia(
    @Param('id') id: string,
    @Body() dto: CreateEvidenciaDto,
    @Req() req: any,
  ) {
    return this.peticionesService.addEvidencia(
      id,
      dto,
      req.tenant.id,
      req.usuario?.id || req.user?.userId,
      this.getUserContext(req),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar petición (solo admin/coord_general)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.peticionesService.remove(id, req.tenant.id, this.getUserContext(req));
  }
}
