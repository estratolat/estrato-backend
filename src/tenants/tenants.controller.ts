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
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId, Tenant } from '../common/decorators/tenant.decorator';
import { Tenant as TenantEntity } from '@prisma/client';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

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
    const tenant = await this.tenantsService.getOrThrow(slug);
    const stats = await this.tenantsService.getStats(tenant.id);

    return {
      tenant: {
        slug: tenant.slug,
        nombre_candidato: tenant.nombre_candidato,
        cargo_busca: tenant.cargo_busca,
        slogan: tenant.slogan,
      },
      stats: {
        totalSimpatizantes: stats.totalVotantes,
        totalEventos: stats.totalEventos,
      },
    };
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
