import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { MessagingService, MensajeExterno } from './messaging.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { FiltersMensajesDto } from './dto/filters-mensajes.dto';
import {
  CreateCanalCrmDto,
  UpdateCanalCrmDto,
} from './dto/canal-crm.dto';

@Injectable()
export class CrmService {
  constructor(
    private prisma: PrismaService,
    private messaging: MessagingService,
  ) {}

  // ==========================================================
  // CANALES CRM
  // ==========================================================
  async getCanales(tenantId: string, soloActivos = false) {
    return this.prisma.canalCrm.findMany({
      where: { tenant_id: tenantId, ...(soloActivos && { activo: true }) },
      orderBy: [{ canal: 'asc' }, { created_at: 'asc' }],
    });
  }

  async getCanal(tenantId: string, id: string) {
    const canal = await this.prisma.canalCrm.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!canal) {
      throw new NotFoundException('Canal CRM no encontrado');
    }
    return canal;
  }

  async createCanal(tenantId: string, data: CreateCanalCrmDto) {
    if (data.webhook_path) {
      const existe = await this.prisma.canalCrm.findFirst({
        where: { webhook_path: data.webhook_path },
      });
      if (existe) {
        throw new BadRequestException('webhook_path ya está en uso');
      }
    }
    return this.prisma.canalCrm.create({
      data: { ...data, tenant_id: tenantId },
    });
  }

  async updateCanal(
    tenantId: string,
    id: string,
    data: UpdateCanalCrmDto,
  ) {
    await this.getCanal(tenantId, id);
    if (data.webhook_path) {
      const existe = await this.prisma.canalCrm.findFirst({
        where: { webhook_path: data.webhook_path, NOT: { id } },
      });
      if (existe) {
        throw new BadRequestException('webhook_path ya está en uso');
      }
    }
    return this.prisma.canalCrm.update({
      where: { id },
      data,
    });
  }

  async deleteCanal(tenantId: string, id: string) {
    await this.getCanal(tenantId, id);
    return this.prisma.canalCrm.delete({ where: { id } });
  }

  async getCanalActivo(tenantId: string, canal: string) {
    return this.prisma.canalCrm.findFirst({
      where: { tenant_id: tenantId, canal, activo: true },
      orderBy: { created_at: 'asc' },
    });
  }

  // ==========================================================
  // CONVERSACIONES / MENSAJES
  // ==========================================================
  async getConversaciones(tenantId: string, filters: FiltersMensajesDto) {
    const where: any = { tenant_id: tenantId };
    if (filters.canal) where.canal = filters.canal;
    if (filters.direccion) where.direccion = filters.direccion;

    if (filters.search) {
      const term = String(filters.search).toLowerCase();
      where.votante = {
        OR: [
          { nombre: { contains: term, mode: 'insensitive' } },
          { telefono: { contains: term, mode: 'insensitive' } },
        ],
      };
    }

    // Traemos mensajes recientes y agrupamos por votante en memoria
    const mensajes = await this.prisma.mensaje.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 1000,
      include: {
        votante: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            email: true,
            colonia: true,
            municipio: true,
            nivel_apoyo: true,
            metadata: true,
          },
        },
      },
    });

    const vistos = new Set<string>();
    const conversaciones: any[] = [];
    for (const m of mensajes) {
      if (vistos.has(m.votante_id)) continue;
      vistos.add(m.votante_id);
      conversaciones.push({
        votante_id: m.votante_id,
        votante: m.votante,
        ultimo_mensaje: {
          id: m.id,
          canal: m.canal,
          direccion: m.direccion,
          contenido: m.contenido,
          leido: m.leido,
          created_at: m.created_at,
        },
      });
      if (conversaciones.length >= (filters.limit || 50)) break;
    }

    const votanteIds = conversaciones.map((c) => c.votante_id);
    const noLeidos = await this.prisma.mensaje.groupBy({
      by: ['votante_id'],
      where: {
        tenant_id: tenantId,
        votante_id: { in: votanteIds },
        leido: false,
        direccion: 'inbound',
      },
      _count: { id: true },
    });

    const conteoNoLeidos = Object.fromEntries(
      noLeidos.map((n) => [n.votante_id, n._count.id]),
    );

    return conversaciones.map((c) => ({
      ...c,
      no_leidos: conteoNoLeidos[c.votante_id] || 0,
    }));
  }

  async getMensajes(tenantId: string, filters: FiltersMensajesDto) {
    const where: any = { tenant_id: tenantId };
    if (filters.votante_id) where.votante_id = filters.votante_id;
    if (filters.canal) where.canal = filters.canal;
    if (filters.direccion) where.direccion = filters.direccion;

    return this.prisma.mensaje.findMany({
      where,
      take: filters.limit,
      orderBy: { created_at: 'asc' },
      include: {
        votante: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            email: true,
            colonia: true,
            metadata: true,
          },
        },
        atendedor: { select: { id: true, nombre: true } },
      },
    });
  }

  async enviarMensaje(tenantId: string, userId: string, data: CreateMensajeDto) {
    const votante = await this.prisma.votante.findFirst({
      where: { id: data.votante_id, tenant_id: tenantId },
    });

    if (!votante) {
      throw new NotFoundException('Votante no encontrado');
    }

    const canal = data.canal;
    let destinatarioId: string | undefined;

    if (canal === 'whatsapp') {
      destinatarioId = votante.telefono || undefined;
    } else if (canal === 'messenger') {
      destinatarioId = (votante.metadata as any)?.messenger_id || undefined;
    } else if (canal === 'instagram') {
      destinatarioId = (votante.metadata as any)?.instagram_id || undefined;
    }

    // Seleccionar canal CRM configurado
    let canalCrm = data.canal_crm_id
      ? await this.prisma.canalCrm.findFirst({
          where: { id: data.canal_crm_id, tenant_id: tenantId, activo: true },
        })
      : null;

    if (!canalCrm && ['whatsapp', 'messenger', 'instagram', 'sms', 'email'].includes(canal)) {
      canalCrm = await this.getCanalActivo(tenantId, canal);
    }

    let envioExterno: { ok: boolean; id_externo?: string; error?: string } = { ok: true };
    const canalesConEnvioExterno = ['whatsapp', 'messenger', 'instagram', 'sms'] as const;
    if (
      destinatarioId &&
      canalCrm &&
      (canalesConEnvioExterno as readonly string[]).includes(canal)
    ) {
      envioExterno = await this.messaging.enviarOutbound(
        canal as 'whatsapp' | 'messenger' | 'instagram' | 'sms',
        destinatarioId,
        data.contenido,
        { canalCrm },
      );
    }

    const mensaje = await this.prisma.mensaje.create({
      data: {
        tenant_id: tenantId,
        votante_id: data.votante_id,
        canal_crm_id: canalCrm?.id || null,
        canal,
        direccion: 'outbound',
        contenido: data.contenido,
        template_usado: data.template_usado || null,
        atendido_por: userId,
        leido: true,
        metadata: envioExterno.ok ? { envioExterno } : { envioExterno, error: envioExterno.error },
      },
      include: {
        votante: { select: { id: true, nombre: true, telefono: true } },
        atendedor: { select: { id: true, nombre: true } },
        canalCrm: { select: { id: true, nombre: true, canal: true } },
      },
    });

    await this.prisma.votante.update({
      where: { id: data.votante_id },
      data: { ultimo_contacto: new Date() },
    });

    return mensaje;
  }

  async marcarLeido(id: string, tenantId: string, userId?: string) {
    const existe = await this.prisma.mensaje.findFirst({
      where: { id, tenant_id: tenantId, direccion: 'inbound' },
    });
    if (!existe) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    return this.prisma.mensaje.update({
      where: { id },
      data: {
        leido: true,
        atendido_por: userId || existe.atendido_por,
      },
      include: {
        votante: { select: { id: true, nombre: true, telefono: true } },
        atendedor: { select: { id: true, nombre: true } },
      },
    });
  }

  async procesarWebhook(
    tenantId: string,
    payload: any,
    canalCrmId?: string,
  ) {
    const mensajesExternos = this.messaging.parseWebhook(payload);
    const guardados = [];

    for (const externo of mensajesExternos) {
      const votante = await this.obtenerOCrearVotanteDesdeExterno(tenantId, externo);

      const existe = await this.prisma.mensaje.findFirst({
        where: {
          tenant_id: tenantId,
          id_externo: externo.id_externo,
          canal: externo.canal,
        },
      });

      if (existe) continue;

      const mensaje = await this.prisma.mensaje.create({
        data: {
          tenant_id: tenantId,
          votante_id: votante.id,
          canal_crm_id: canalCrmId || null,
          canal: externo.canal,
          direccion: 'inbound',
          contenido: externo.contenido,
          id_externo: externo.id_externo,
          metadata: externo.metadata || {},
          leido: false,
        },
        include: {
          votante: { select: { id: true, nombre: true, telefono: true } },
          canalCrm: { select: { id: true, nombre: true, canal: true } },
        },
      });

      await this.prisma.votante.update({
        where: { id: votante.id },
        data: { ultimo_contacto: new Date() },
      });

      guardados.push(mensaje);
    }

    return { recibidos: mensajesExternos.length, guardados: guardados.length };
  }

  private async obtenerOCrearVotanteDesdeExterno(tenantId: string, externo: MensajeExterno) {
    let votante: any = null;

    if (externo.canal === 'whatsapp' && externo.remitente_id) {
      const telefono = this.normalizarTelefono(externo.remitente_id);
      votante = await this.prisma.votante.findFirst({
        where: {
          tenant_id: tenantId,
          telefono: { contains: telefono.replace('+', ''), mode: 'insensitive' },
        },
      });
      if (!votante) {
        votante = await this.prisma.votante.create({
          data: {
            tenant_id: tenantId,
            nombre: externo.remitente_nombre || 'Usuario WhatsApp',
            telefono: telefono,
            telefono_hash: this.hashSimple(telefono),
            origen_qr: 'whatsapp',
            nivel_apoyo: 3,
            activo: true,
          },
        });
      }
    } else if (externo.canal === 'messenger' && externo.remitente_id) {
      votante = await this.buscarVotantePorMetadata(tenantId, 'messenger_id', externo.remitente_id);
      if (!votante) {
        votante = await this.prisma.votante.create({
          data: {
            tenant_id: tenantId,
            nombre: 'Usuario Messenger',
            origen_qr: 'messenger',
            nivel_apoyo: 3,
            activo: true,
            metadata: { messenger_id: externo.remitente_id },
          },
        });
      }
    } else if (externo.canal === 'instagram' && externo.remitente_id) {
      votante = await this.buscarVotantePorMetadata(tenantId, 'instagram_id', externo.remitente_id);
      if (!votante) {
        votante = await this.prisma.votante.create({
          data: {
            tenant_id: tenantId,
            nombre: 'Usuario Instagram',
            origen_qr: 'instagram',
            nivel_apoyo: 3,
            activo: true,
            metadata: { instagram_id: externo.remitente_id },
          },
        });
      }
    }

    if (!votante) {
      throw new Error('No se pudo identificar el remitente del mensaje');
    }

    return votante;
  }

  private async buscarVotantePorMetadata(tenantId: string, key: string, value: string) {
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT id FROM votantes
      WHERE tenant_id = ${tenantId}::uuid
        AND metadata ->> ${key} = ${value}
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;
    return this.prisma.votante.findUnique({ where: { id: rows[0].id } });
  }

  async getStats(tenantId: string) {
    const where = { tenant_id: tenantId };
    const [total, pendientes, porCanal] = await Promise.all([
      this.prisma.mensaje.count({ where }),
      this.prisma.mensaje.count({ where: { ...where, leido: false, direccion: 'inbound' } }),
      this.prisma.mensaje.groupBy({
        by: ['canal', 'direccion'],
        where,
        _count: { id: true },
      }),
    ]);

    return { total, pendientes, porCanal };
  }

  private normalizarTelefono(value: string): string {
    const digits = String(value).replace(/\D/g, '');
    if (digits.startsWith('52') && digits.length >= 12) return `+${digits}`;
    if (digits.length === 10) return `+52${digits}`;
    return `+${digits}`;
  }

  private hashSimple(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(12, '0');
  }
}
