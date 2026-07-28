import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('EMAIL_HOST', 'smtp.resend.com'),
      port: Number(this.config.get('EMAIL_PORT', 465)),
      secure: this.config.get('EMAIL_SECURE', 'true') === 'true',
      auth: {
        user: this.config.get('EMAIL_USER', 'resend'),
        pass: this.config.get('RESEND_API_KEY', ''),
      },
    });
  }

  async sendInvitationEmail(
    to: string,
    nombre: string,
    invitationUrl: string,
    invitadorNombre?: string,
  ): Promise<void> {
    const from = this.config.get('EMAIL_FROM', 'admin@estrato.lat');
    const fromName = this.config.get('EMAIL_FROM_NAME', 'ESTRATO');
    const apiKey = this.config.get('RESEND_API_KEY', '') || '';

    this.logger.log(
      `[MailService] Preparando envío a ${to} | host=${this.config.get('EMAIL_HOST')} | keyPrefix=${apiKey.slice(0, 8)}...`,
    );

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to,
        subject: 'Tu acceso a ESTRATO',
        text: this.buildPlainText(nombre, invitationUrl, invitadorNombre),
        html: this.buildHtml(nombre, invitationUrl, invitadorNombre),
      });
      this.logger.log(`Correo de invitación enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando correo a ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendBrigadaWelcomeEmail(
    to: string,
    nombre: string,
    telefono: string,
    pin: string,
    invitadorNombre?: string,
  ): Promise<void> {
    const from = this.config.get('EMAIL_FROM', 'admin@estrato.lat');
    const fromName = this.config.get('EMAIL_FROM_NAME', 'ESTRATO');
    const appUrl = this.config.get('APP_URL', 'https://estrato.lat');
    const loginUrl = `${appUrl}/brigada/login`;
    const apiKey = this.config.get('RESEND_API_KEY', '') || '';

    this.logger.log(
      `[MailService] Preparando envío de brigada a ${to} | host=${this.config.get('EMAIL_HOST')} | keyPrefix=${apiKey.slice(0, 8)}...`,
    );

    const saludo = nombre ? `Hola ${nombre},` : 'Hola,';
    const firma = invitadorNombre ? `\n\n${invitadorNombre} te ha invitado a unirte.` : '';

    const text = `${saludo}\n\nHas sido registrado como brigadista en ESTRATO.\n\nPara entrar a la App de Brigada usa estos datos:\n\nTeléfono: ${telefono}\nPIN: ${pin}\n\nDescarga o abre la app y entra en:\n${loginUrl}\n\nNo compartas tu PIN con nadie.${firma}\n\n— Equipo ESTRATO`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu acceso a la App de Brigada ESTRATO</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
          <tr>
            <td style="background-color:#d73216;padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.05em;">ESTRATO</h1>
              <p style="margin:8px 0 0;color:#ffffff/80;font-size:13px;">App de Brigada</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#18181b;font-size:16px;line-height:1.5;">${saludo}</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                Has sido registrado como <strong style="color:#d73216;">brigadista</strong> en ESTRATO. Usa estos datos para entrar a la app:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;background:#f9fafb;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;color:#6b7280;font-size:13px;">Teléfono</p>
                    <p style="margin:4px 0 0;color:#18181b;font-size:18px;font-weight:700;letter-spacing:0.05em;">${telefono}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0;color:#6b7280;font-size:13px;">PIN</p>
                    <p style="margin:4px 0 0;color:#d73216;font-size:24px;font-weight:800;letter-spacing:0.1em;">${pin}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${loginUrl}" style="display:inline-block;background-color:#d73216;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;">Entrar a la app</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0;word-break:break-all;color:#d73216;font-size:13px;line-height:1.5;">
                ${loginUrl}
              </p>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
                No compartas tu PIN con nadie. Si no esperabas este registro, ignora este correo.
              </p>
              ${invitadorNombre ? `<p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">${invitadorNombre} te ha invitado a unirte.</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:20px 24px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 ESTRATO. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to,
        subject: 'Tu acceso a la App de Brigada ESTRATO',
        text,
        html,
      });
      this.logger.log(`Correo de brigada enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando correo de brigada a ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private buildPlainText(nombre: string, url: string, invitador?: string): string {
    const saludo = nombre ? `Hola ${nombre},` : 'Hola,';
    const firma = invitador ? `\n\n${invitador} te ha invitado a unirte.` : '';
    return `${saludo}\n\nHas sido invitado a colaborar en ESTRATO, la plataforma de gestión de campañas políticas.\n\nPara activar tu cuenta y definir tu contraseña, abre el siguiente enlace:\n\n${url}\n\nEl enlace expira en 7 días. Si no esperabas esta invitación, ignora este correo.${firma}\n\n— Equipo ESTRATO`;
  }

  private buildHtml(nombre: string, url: string, invitador?: string): string {
    const saludo = nombre ? `Hola ${nombre},` : 'Hola,';
    const firma = invitador ? `<p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">${invitador} te ha invitado a unirte.</p>` : '';
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu acceso a ESTRATO</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
          <tr>
            <td style="background-color:#d73216;padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.05em;">ESTRATO</h1>
              <p style="margin:8px 0 0;color:#ffffff/80;font-size:13px;">Plataforma de gestión de campañas</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#18181b;font-size:16px;line-height:1.5;">${saludo}</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                Has sido invitado a colaborar en <strong style="color:#d73216;">ESTRATO</strong>. Activa tu cuenta y define tu contraseña haciendo clic en el botón de abajo.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${url}" style="display:inline-block;background-color:#d73216;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;">Activar mi cuenta</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0;word-break:break-all;color:#d73216;font-size:13px;line-height:1.5;">
                ${url}
              </p>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
                El enlace expira en 7 días. Si no esperabas esta invitación, ignora este correo.
              </p>
              ${firma}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:20px 24px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 ESTRATO. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
