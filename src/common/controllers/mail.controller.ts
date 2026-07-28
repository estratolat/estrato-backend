import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { RolesGuard, Roles } from '../guards/roles.guard';
import { MailService } from '../services/mail.service';
import { ConfigService } from '@nestjs/config';

class TestEmailDto {
  email: string;
}

@ApiTags('Mail')
@Controller('mail')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  @Post('test')
  @Roles('owner', 'candidato')
  @ApiOperation({ summary: 'Enviar correo de prueba (diagnóstico)' })
  async sendTest(@Body() body: TestEmailDto, @Req() req) {
    const to = body.email?.trim();
    if (!to) {
      return { ok: false, error: 'Falta el correo destino' };
    }

    const appUrl = this.config.get('APP_URL', 'https://estrato.lat');
    const testUrl = `${appUrl}/invitacion?token=test-token`;

    try {
      await this.mailService.sendInvitationEmail(to, 'Usuario de prueba', testUrl, req.user?.nombre);
      return { ok: true, message: `Correo de prueba enviado a ${to}` };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message,
        code: error.code,
        response: error.response,
        responseCode: error.responseCode,
        command: error.command,
      };
    }
  }

  @Get('config')
  @Roles('owner', 'candidato')
  @ApiOperation({ summary: 'Verificar configuración de correo (sin secrets)' })
  getConfig() {
    const host = this.config.get('EMAIL_HOST', 'smtp.resend.com');
    const port = this.config.get('EMAIL_PORT', '465');
    const secure = this.config.get('EMAIL_SECURE', 'true');
    const user = this.config.get('EMAIL_USER', 'resend');
    const from = this.config.get('EMAIL_FROM', 'admin@estrato.lat');
    const fromName = this.config.get('EMAIL_FROM_NAME', 'ESTRATO');
    const appUrl = this.config.get('APP_URL', 'https://estrato.lat');
    const apiKey = this.config.get('RESEND_API_KEY', '');

    return {
      host,
      port,
      secure,
      user,
      from,
      fromName,
      appUrl,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.slice(0, 6)}...` : null,
    };
  }
}
