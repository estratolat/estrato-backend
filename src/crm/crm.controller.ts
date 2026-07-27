import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'express';
import { CrmService } from './crm.service';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PrismaService } from '../common/services/prisma.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { FiltersMensajesDto } from './dto/filters-mensajes.dto';
import {
  CreateCanalCrmDto,
  UpdateCanalCrmDto,
} from './dto/canal-crm.dto';

interface RequestConTenant extends Request {
  tenant: { id: string };
  usuario: { id: string; rol: string; permisos: any };
}

@Controller('crm')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly messagingService: MessagingService,
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================================
  // CANALES CRM
  // ==========================================================
  @Get('canales')
  getCanales(
    @Query('solo_activos') soloActivos: string,
    @Req() req: RequestConTenant,
  ) {
    return this.crmService.getCanales(
      req.tenant.id,
      soloActivos === 'true',
    );
  }

  @Get('canales/:id')
  getCanal(
    @Param('id') id: string,
    @Req() req: RequestConTenant,
  ) {
    return this.crmService.getCanal(req.tenant.id, id);
  }

  @Post('canales')
  createCanal(
    @Body() data: CreateCanalCrmDto,
    @Req() req: RequestConTenant,
  ) {
    return this.crmService.createCanal(req.tenant.id, data);
  }

  @Patch('canales/:id')
  updateCanal(
    @Param('id') id: string,
    @Body() data: UpdateCanalCrmDto,
    @Req() req: RequestConTenant,
  ) {
    return this.crmService.updateCanal(req.tenant.id, id, data);
  }

  @Delete('canales/:id')
  deleteCanal(
    @Param('id') id: string,
    @Req() req: RequestConTenant,
  ) {
    return this.crmService.deleteCanal(req.tenant.id, id);
  }

  // ==========================================================
  // CONVERSACIONES / MENSAJES
  // ==========================================================
  @Get('conversaciones')
  getConversaciones(
    @Query() filters: FiltersMensajesDto,
    @Req() req: RequestConTenant,
  ) {
    return this.crmService.getConversaciones(req.tenant.id, filters);
  }

  @Get('mensajes')
  getMensajes(
    @Query() filters: FiltersMensajesDto,
    @Req() req: RequestConTenant,
  ) {
    return this.crmService.getMensajes(req.tenant.id, filters);
  }

  @Post('mensajes')
  enviarMensaje(
    @Body() data: CreateMensajeDto,
    @Req() req: RequestConTenant,
  ) {
    return this.crmService.enviarMensaje(req.tenant.id, req.usuario.id, data);
  }

  @Patch('mensajes/:id/leido')
  marcarLeido(
    @Param('id') id: string,
    @Req() req: RequestConTenant,
  ) {
    return this.crmService.marcarLeido(id, req.tenant.id, req.usuario.id);
  }

  @Get('stats')
  getStats(@Req() req: RequestConTenant) {
    return this.crmService.getStats(req.tenant.id);
  }

  // ==========================================================
  // WEBHOOKS PÚBLICOS POR CANAL
  // ==========================================================
  @Post('webhook/:tenantSlug/:webhookPath')
  async recibirWebhook(
    @Param('tenantSlug') tenantSlug: string,
    @Param('webhookPath') webhookPath: string,
    @Body() payload: any,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) {
      throw new ForbiddenException('Tenant no encontrado');
    }

    const canalCrm = await this.prisma.canalCrm.findFirst({
      where: { tenant_id: tenant.id, webhook_path: webhookPath, activo: true },
    });
    if (!canalCrm) {
      throw new ForbiddenException('Canal CRM no encontrado o inactivo');
    }

    await this.prisma.setTenant(tenant.id);
    return this.crmService.procesarWebhook(tenant.id, payload, canalCrm.id);
  }

  @Get('webhook/:tenantSlug/:webhookPath')
  async verificarWebhook(
    @Param('tenantSlug') tenantSlug: string,
    @Param('webhookPath') webhookPath: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode !== 'subscribe') {
      throw new BadRequestException('Modo no soportado');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) {
      throw new ForbiddenException('Tenant no encontrado');
    }

    const canalCrm = await this.prisma.canalCrm.findFirst({
      where: { tenant_id: tenant.id, webhook_path: webhookPath, activo: true },
    });
    if (!canalCrm) {
      throw new ForbiddenException('Canal CRM no encontrado o inactivo');
    }

    const expected = this.messagingService.generarVerifyToken(canalCrm);
    if (verifyToken !== expected) {
      throw new ForbiddenException('Verify token inválido');
    }

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(challenge);
  }
}
