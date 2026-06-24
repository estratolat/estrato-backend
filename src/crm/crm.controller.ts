import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
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

interface RequestConTenant extends Request {
  tenant: { id: string };
  usuario: { id: string };
}

@Controller('crm')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly messagingService: MessagingService,
    private readonly prisma: PrismaService,
  ) {}

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

  // Webhooks públicos para Meta (sin JWT)
  @Post('webhook/:tenantSlug')
  async recibirWebhook(
    @Param('tenantSlug') tenantSlug: string,
    @Body() payload: any,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) {
      throw new ForbiddenException('Tenant no encontrado');
    }

    await this.prisma.setTenant(tenant.id);
    return this.crmService.procesarWebhook(tenant.id, payload);
  }

  @Get('webhook/:tenantSlug')
  async verificarWebhook(
    @Param('tenantSlug') tenantSlug: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode !== 'subscribe') {
      throw new BadRequestException('Modo no soportado');
    }

    const expected = this.messagingService.generarVerifyToken();
    if (verifyToken !== expected) {
      throw new ForbiddenException('Verify token inválido');
    }

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(challenge);
  }
}
