import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { VotantesService } from '../votantes/votantes.service';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly votantesService: VotantesService,
  ) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Obtener tenant por slug (público)' })
  async getBySlug(@Param('slug') slug: string) {
    return this.tenantsService.getOrThrow(slug);
  }

  @Get(':slug/stats')
  @ApiOperation({ summary: 'Estadísticas del tenant (público)' })
  async getStats(@Param('slug') slug: string) {
    const tenant = await this.tenantsService.getOrThrow(slug);
    return this.tenantsService.getStats(tenant.id);
  }

  @Get(':slug/landing')
  @ApiOperation({ summary: 'Datos para landing pública' })
  async getLandingData(@Param('slug') slug: string) {
    const landing = await this.tenantsService.getLandingData(slug);
    return landing;
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo tenant' })
  async create(@Body() data: {
    slug: string;
    nombre_candidato: string;
    cargo_busca?: string;
    slogan?: string;
  }) {
    return this.tenantsService.create(data);
  }

  @Post(':slug/votantes')
  @ApiOperation({ summary: 'Registrar votante público desde landing' })
  async registrarVotantePublico(
    @Param('slug') slug: string,
    @Body() data: {
      nombre: string;
      telefono?: string;
      colonia?: string;
      seccion_electoral?: string;
      nivel_apoyo?: number;
      origen_qr?: string;
    },
  ) {
    const tenant = await this.tenantsService.getOrThrow(slug);
    return this.votantesService.create({
      ...data,
      tenant_id: tenant.id,
      activo: true,
      nivel_apoyo: data.nivel_apoyo ?? 3,
    });
  }

  @Patch(':id/veda')
  @UseGuards(TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar/desactivar veda electoral' })
  async toggleVeda(
    @Param('id') id: string,
    @Body('veda_activa') veda_activa: boolean,
  ) {
    return this.tenantsService.toggleVeda(id, veda_activa);
  }
}
