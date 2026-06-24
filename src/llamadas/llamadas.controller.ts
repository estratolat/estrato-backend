import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Delete,
  Patch,
  Headers,
} from '@nestjs/common';
import { LlamadasService } from './llamadas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CreateCampanaDto } from './dto/create-campana.dto';
import { UpdateCampanaDto } from './dto/update-campana.dto';
import { ImportarVotantesDto } from './dto/importar-votantes.dto';
import { IniciarLlamadaDto } from './dto/iniciar-llamada.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Llamadas')
@Controller('llamadas')
export class LlamadasController {
  constructor(private readonly llamadasService: LlamadasService) {}

  private tenantId(req: any) {
    return req.user?.tenant_id || req.headers['x-tenant-id'];
  }

  @Get('campanas')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar campañas de llamadas automáticas' })
  async getCampanas(@Req() req) {
    return this.llamadasService.findAll(this.tenantId(req));
  }

  @Post('campanas')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear campaña de llamadas' })
  async createCampana(@Body() dto: CreateCampanaDto, @Req() req) {
    return this.llamadasService.create(this.tenantId(req), req.user.userId, dto);
  }

  @Get('campanas/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener campaña con llamadas' })
  async getCampana(@Param('id') id: string, @Req() req) {
    return this.llamadasService.findOne(id, this.tenantId(req));
  }

  @Patch('campanas/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar campaña de llamadas' })
  async updateCampana(
    @Param('id') id: string,
    @Body() dto: UpdateCampanaDto,
    @Req() req,
  ) {
    return this.llamadasService.update(id, this.tenantId(req), dto);
  }

  @Delete('campanas/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar campaña de llamadas' })
  async deleteCampana(@Param('id') id: string, @Req() req) {
    return this.llamadasService.remove(id, this.tenantId(req));
  }

  @Post('campanas/:id/importar')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Importar votantes a la campaña' })
  async importarVotantes(
    @Param('id') id: string,
    @Body() dto: ImportarVotantesDto,
    @Req() req,
  ) {
    return this.llamadasService.importarVotantes(id, this.tenantId(req), dto.votante_ids);
  }

  @Post('campanas/:id/llamadas')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar llamada a un votante' })
  async iniciarLlamada(
    @Param('id') id: string,
    @Body() dto: IniciarLlamadaDto,
    @Req() req,
  ) {
    return this.llamadasService.iniciarLlamada(id, dto.votante_id, this.tenantId(req));
  }

  @Get('campanas/:id/llamadas')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar llamadas de la campaña' })
  async getLlamadas(@Param('id') id: string, @Req() req) {
    return this.llamadasService.getLlamadas(id, this.tenantId(req));
  }

  // Webhook público del proveedor de llamadas (sin JWT)
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook para eventos del proveedor de llamadas' })
  async webhook(@Body() payload: any, @Headers() headers: Record<string, string>) {
    // Opcional: validar firma del webhook aquí si se configura WEBHOOK_SECRET
    return this.llamadasService.procesarWebhook(payload);
  }
}
