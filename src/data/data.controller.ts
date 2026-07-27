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
import { DataService } from './data.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
import { FiltroIndicadoresDto } from './dto/filtro-indicadores.dto';
import { CruceIndicadoresDto } from './dto/cruce-indicadores.dto';

@ApiTags('Data')
@Controller('data')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('indicadores')
  @ApiOperation({ summary: 'Listar indicadores municipales' })
  findAll(@Query() filtros: FiltroIndicadoresDto, @Req() req) {
    return this.dataService.findAll(req.tenant.id, filtros);
  }

  @Get('indicadores/:id')
  @ApiOperation({ summary: 'Obtener un indicador por ID' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.dataService.findOne(req.tenant.id, id);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de indicadores por categoría' })
  getResumen(@Req() req) {
    return this.dataService.getResumen(req.tenant.id);
  }

  @Get('cruce')
  @ApiOperation({ summary: 'Cruzar dos indicadores para compararlos' })
  getCruce(@Query() query: CruceIndicadoresDto, @Req() req) {
    return this.dataService.getCruce(
      req.tenant.id,
      query.indicadorA,
      query.indicadorB,
      query.periodo,
    );
  }

  @Post('indicadores')
  @UseGuards(RolesGuard)
  @Roles('owner', 'candidato', 'superadmin')
  @ApiOperation({ summary: 'Crear indicador municipal (solo admin/candidato)' })
  create(@Body() dto: CreateIndicadorDto, @Req() req) {
    return this.dataService.create(req.tenant.id, dto);
  }

  @Patch('indicadores/:id')
  @UseGuards(RolesGuard)
  @Roles('owner', 'candidato', 'superadmin')
  @ApiOperation({ summary: 'Actualizar indicador municipal (solo admin/candidato)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIndicadorDto,
    @Req() req,
  ) {
    return this.dataService.update(req.tenant.id, id, dto);
  }

  @Delete('indicadores/:id')
  @UseGuards(RolesGuard)
  @Roles('owner', 'candidato', 'superadmin')
  @ApiOperation({ summary: 'Eliminar indicador municipal (solo admin/candidato)' })
  remove(@Param('id') id: string, @Req() req) {
    return this.dataService.remove(req.tenant.id, id);
  }
}
