import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateCampanaDto } from './dto/create-campana.dto';
import { UpdateCampanaDto } from './dto/update-campana.dto';
import { VapiClient } from '@vapi-ai/server-sdk';

@Injectable()
export class LlamadasService {
  private readonly logger = new Logger(LlamadasService.name);

  constructor(private prisma: PrismaService) {}

  private getProveedorClient() {
    const token = process.env.LLAMADAS_API_KEY || process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY || '';
    if (!token) {
      this.logger.warn('LLAMADAS_API_KEY no configurada. Las llamadas se simularán.');
      return null;
    }
    return new VapiClient({ token });
  }

  async findAll(tenantId: string) {
    return this.prisma.campanaVapi.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: {
        creador: { select: { id: true, nombre: true, email: true } },
        _count: { select: { llamadas: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const campana = await this.prisma.campanaVapi.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        creador: { select: { id: true, nombre: true, email: true } },
        llamadas: {
          include: { votante: { select: { id: true, nombre: true, telefono: true } } },
          orderBy: { created_at: 'desc' },
        },
      },
    });
    if (!campana) throw new NotFoundException('Campaña no encontrada');
    return campana;
  }

  async create(tenantId: string, userId: string, dto: CreateCampanaDto) {
    return this.prisma.campanaVapi.create({
      data: {
        tenant_id: tenantId,
        created_by: userId,
        nombre: dto.nombre,
        descripcion: dto.descripcion || null,
        script: dto.script || null,
        voz_id_elevenlabs: dto.voz_id_elevenlabs || null,
        assistant_id: dto.assistant_id || null,
        phone_number_id: dto.phone_number_id || null,
        status: dto.status || 'borrador',
        total_numeros: 0,
        llamadas_exitosas: 0,
      },
      include: {
        creador: { select: { id: true, nombre: true, email: true } },
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateCampanaDto) {
    const existe = await this.prisma.campanaVapi.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!existe) throw new NotFoundException('Campaña no encontrada');

    return this.prisma.campanaVapi.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        script: dto.script,
        voz_id_elevenlabs: dto.voz_id_elevenlabs,
        assistant_id: dto.assistant_id,
        phone_number_id: dto.phone_number_id,
        status: dto.status,
      },
      include: {
        creador: { select: { id: true, nombre: true, email: true } },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const existe = await this.prisma.campanaVapi.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!existe) throw new NotFoundException('Campaña no encontrada');
    await this.prisma.campanaVapi.delete({ where: { id } });
    return { ok: true };
  }

  async importarVotantes(id: string, tenantId: string, votanteIds: string[]) {
    const campana = await this.findOne(id, tenantId);
    if (!votanteIds.length) throw new BadRequestException('No se enviaron votantes');

    const votantes = await this.prisma.votante.findMany({
      where: {
        id: { in: votanteIds },
        tenant_id: tenantId,
        activo: true,
        telefono_hash: { not: null },
      },
      select: { id: true, telefono: true, telefono_hash: true },
    });

    if (!votantes.length) throw new BadRequestException('No se encontraron votantes con teléfono');

    const creadas = [];
    for (const v of votantes) {
      const telefonoLimpio = v.telefono ? this.limpiarTelefono(v.telefono) : '';
      if (!telefonoLimpio) continue;

      const llamada = await this.prisma.llamadaVapi.upsert({
        where: { campana_id_votante_id: { campana_id: id, votante_id: v.id } },
        create: {
          campana_id: id,
          votante_id: v.id,
          tenant_id: tenantId,
          telefono: telefonoLimpio,
          status: 'pendiente',
        },
        update: {},
        include: { votante: { select: { id: true, nombre: true, telefono: true } } },
      });
      creadas.push(llamada);
    }

    await this.prisma.campanaVapi.update({
      where: { id },
      data: { total_numeros: { set: creadas.length } },
    });

    return { campana, importadas: creadas.length, llamadas: creadas };
  }

  async iniciarLlamada(campanaId: string, votanteId: string, tenantId: string) {
    const campana = await this.findOne(campanaId, tenantId);
    const llamada = await this.prisma.llamadaVapi.findFirst({
      where: { campana_id: campanaId, votante_id: votanteId },
      include: { votante: { select: { id: true, nombre: true, telefono: true } } },
    });
    if (!llamada) throw new NotFoundException('Llamada no encontrada en la campaña');

    const assistantId = campana.assistant_id || process.env.LLAMADAS_DEFAULT_ASSISTANT_ID || process.env.VAPI_DEFAULT_ASSISTANT_ID || '';
    const phoneNumberId = campana.phone_number_id || process.env.LLAMADAS_DEFAULT_PHONE_NUMBER_ID || process.env.VAPI_DEFAULT_PHONE_NUMBER_ID || '';

    if (!assistantId || !phoneNumberId) {
      throw new BadRequestException(
        'Falta configurar assistant_id y phone_number_id en la campaña o variables de entorno',
      );
    }

    const client = this.getProveedorClient();
    let proveedorCallId: string | null = null;

    if (client) {
      try {
        const call = (await client.calls.create({
          assistantId,
          phoneNumberId,
          customer: {
            number: llamada.telefono,
            name: llamada.votante?.nombre || '',
          },
        })) as any;
        proveedorCallId = call?.id || null;
      } catch (e) {
        this.logger.error('Error creando llamada en proveedor:', e);
        throw new BadRequestException('No se pudo iniciar la llamada automática');
      }
    } else {
      // Modo simulación cuando no hay API key
      proveedorCallId = `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    const actualizada = await this.prisma.llamadaVapi.update({
      where: { id: llamada.id },
      data: {
        status: proveedorCallId ? 'en_curso' : 'fallida',
        metadata: { proveedor_call_id: proveedorCallId, assistant_id: assistantId, iniciada_en: new Date() },
      },
      include: { votante: { select: { id: true, nombre: true, telefono: true } } },
    });

    return actualizada;
  }

  async procesarWebhook(payload: any) {
    const msg = payload?.message || payload || {};
    const telefono = this.limpiarTelefono(
      msg.customer?.number || msg.phoneNumber?.number || '',
    );
    const proveedorCallId = msg.call?.id || msg.id || '';
    const status = this.normalizarStatus(msg.status || msg.call?.status);
    const transcripcion = msg.transcript || msg.call?.transcript || '';
    const duracion = msg.durationSeconds || msg.call?.durationSeconds || 0;
    const audioUrl = msg.recordingUrl || msg.call?.recordingUrl || '';
    const sentimiento = msg.analysis?.summary ? '' : '';
    const resumen = msg.summary || msg.call?.summary || '';

    if (!proveedorCallId) {
      this.logger.warn('Webhook sin ID de llamada');
      return { ok: false, reason: 'missing_call_id' };
    }

    const llamada = await this.prisma.llamadaVapi.findFirst({
      where: {
        OR: [
          { metadata: { path: ['proveedor_call_id'], equals: proveedorCallId } },
          { metadata: { path: ['external_call_id'], equals: proveedorCallId } },
          { telefono },
        ],
      },
      orderBy: { created_at: 'desc' },
    });

    if (!llamada) {
      this.logger.warn(`Llamada no encontrada para ${proveedorCallId} / ${telefono}`);
      return { ok: false, reason: 'llamada_no_encontrada' };
    }

    const exitosa = status === 'contestada' || status === 'completada';

    await this.prisma.llamadaVapi.update({
      where: { id: llamada.id },
      data: {
        status,
        transcripcion: transcripcion || null,
        duracion_seg: duracion || null,
        audio_url: audioUrl || null,
        sentimiento: sentimiento || null,
        metadata: {
          ...(llamada.metadata as object),
          proveedor_call_id: proveedorCallId,
          resumen,
          ended_reason: msg.endedReason || msg.call?.endedReason || '',
          ultima_actualizacion: new Date(),
        },
      },
    });

    if (exitosa) {
      await this.prisma.campanaVapi.update({
        where: { id: llamada.campana_id },
        data: { llamadas_exitosas: { increment: 1 } },
      });
    }

    return { ok: true };
  }

  async getLlamadas(campanaId: string, tenantId: string) {
    return this.prisma.llamadaVapi.findMany({
      where: { campana_id: campanaId, tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: { votante: { select: { id: true, nombre: true, telefono: true } } },
    });
  }

  private limpiarTelefono(tel: string): string {
    if (!tel) return '';
    const digits = String(tel).replace(/\D/g, '');
    if (digits.length === 10) return `+52${digits}`;
    if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    if (digits.length > 10) return `+${digits}`;
    return digits ? `+52${digits}` : '';
  }

  private normalizarStatus(status?: string): string {
    if (!status) return 'desconocido';
    const s = String(status).toLowerCase();
    if (['completed', 'done', 'ended', 'success'].includes(s)) return 'completada';
    if (['in-progress', 'in_progress', 'ongoing'].includes(s)) return 'en_curso';
    if (['no-answer', 'no_answer', 'unanswered'].includes(s)) return 'no_contesta';
    if (['busy', 'failed', 'error'].includes(s)) return 'fallida';
    if (['voicemail', 'machine'].includes(s)) return 'buzon';
    if (s === 'contestada') return 'contestada';
    return s;
  }
}
