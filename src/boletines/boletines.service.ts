import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AnthropicService, HuellaCandidato } from '../common/services/anthropic.service';
import { CreateBoletinDto } from './dto/create-boletin.dto';
import { GenerarBoletinDto } from './dto/generar-boletin.dto';

@Injectable()
export class BoletinesService {
  constructor(
    private prisma: PrismaService,
    private anthropic: AnthropicService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.boletin.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: {
        creador: { select: { id: true, nombre: true, email: true } },
        aprobador: { select: { id: true, nombre: true } },
      },
    });
  }

  async create(tenantId: string, userId: string, data: CreateBoletinDto) {
    return this.prisma.boletin.create({
      data: {
        tenant_id: tenantId,
        created_by: userId,
        prompt_usuario: data.prompt_usuario,
        titulo: data.titulo ?? null,
        bajada: data.bajada ?? null,
        desarrollo: data.desarrollo ?? null,
        copy_generado: data.copy_generado ?? null,
        caption_redes: data.caption_redes ?? null,
        imagen_url: data.imagen_url ?? null,
        aprobado: data.aprobado ?? false,
      },
      include: {
        creador: { select: { id: true, nombre: true, email: true } },
      },
    });
  }

  async generar(tenantId: string, userId: string, dto: GenerarBoletinDto) {
    const perfil = await this.prisma.perfilCandidato.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!perfil) {
      throw new NotFoundException('No existe perfil de candidato para esta campaña');
    }

    const huella: HuellaCandidato = {
      palabras_clave: perfil.palabras_clave || [],
      muletillas: perfil.muletillas || [],
      frases_recurrentes: perfil.frases_recurrentes || [],
      llamados_accion: perfil.llamados_accion || [],
      tono: perfil.tono || '',
      propuesta_central: perfil.propuesta_central || '',
      estilo_redes: perfil.estilo_redes || '',
    };

    const contexto = {
      tema: dto.tema,
      que: dto.que,
      quien: dto.quien,
      como: dto.como,
      cuando: dto.cuando,
      donde: dto.donde,
      por_que: dto.por_que,
      para_que: dto.para_que,
    };

    const generado = await this.anthropic.generarConHuella(huella, {
      perfil: {
        nombre: perfil.nombre || undefined,
        biografia: perfil.biografia || undefined,
        gustos: perfil.gustos || undefined,
        propuesta_central: perfil.propuesta_central || undefined,
      },
      tipo: dto.tipo,
      contexto,
    });

    const promptUsuario = JSON.stringify({ tipo: dto.tipo, ...contexto });

    const boletin = await this.prisma.boletin.create({
      data: {
        tenant_id: tenantId,
        created_by: userId,
        prompt_usuario: promptUsuario,
        titulo: dto.tipo === 'redes' ? null : generado.titulo ?? null,
        bajada: dto.tipo === 'redes' ? null : generado.bajada ?? null,
        desarrollo: dto.tipo === 'redes' ? null : generado.desarrollo ?? null,
        copy_generado: dto.tipo === 'redes' ? null : generado.texto ?? null,
        caption_redes: dto.tipo === 'redes' ? generado.caption ?? null : null,
        versiones_redes:
          dto.tipo === 'redes' && Array.isArray(generado.versiones_redes) && generado.versiones_redes.length > 0
            ? (generado.versiones_redes as any)
            : null,
        imagen_url: null,
        aprobado: false,
      },
      include: {
        creador: { select: { id: true, nombre: true, email: true } },
      },
    });

    return {
      ...generado,
      boletin,
    };
  }

  async aprobar(id: string, tenantId: string, userId: string) {
    const existe = await this.prisma.boletin.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!existe) {
      throw new NotFoundException('Boletín no encontrado');
    }

    return this.prisma.boletin.update({
      where: { id },
      data: { aprobado: true, aprobado_por: userId },
      include: {
        creador: { select: { id: true, nombre: true } },
        aprobador: { select: { id: true, nombre: true } },
      },
    });
  }

  async rechazar(id: string, tenantId: string) {
    const existe = await this.prisma.boletin.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!existe) {
      throw new NotFoundException('Boletín no encontrado');
    }

    return this.prisma.boletin.update({
      where: { id },
      data: { aprobado: false, aprobado_por: null },
      include: {
        creador: { select: { id: true, nombre: true } },
      },
    });
  }
}
