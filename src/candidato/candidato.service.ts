import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AnthropicService, HuellaCandidato } from '../common/services/anthropic.service';
import { TranscripcionService } from '../common/services/transcripcion.service';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@Injectable()
export class CandidatoService {
  constructor(
    private prisma: PrismaService,
    private anthropic: AnthropicService,
    private transcripcion: TranscripcionService,
  ) {}

  async getPerfil(tenantId: string) {
    const perfil = await this.prisma.perfilCandidato.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!perfil) {
      return null;
    }

    return perfil;
  }

  async upsertPerfil(tenantId: string, data: UpdatePerfilDto) {
    const existente = await this.prisma.perfilCandidato.findUnique({
      where: { tenant_id: tenantId },
    });

    const payload: any = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre;
    if (data.biografia !== undefined) payload.biografia = data.biografia;
    if (data.gustos !== undefined) payload.gustos = data.gustos;
    if (data.discurso !== undefined) payload.discurso = data.discurso;
    if (data.video_url !== undefined) payload.video_url = data.video_url;
    if (data.video_transcripcion !== undefined) payload.video_transcripcion = data.video_transcripcion;

    if (existente) {
      return this.prisma.perfilCandidato.update({
        where: { tenant_id: tenantId },
        data: payload,
      });
    }

    return this.prisma.perfilCandidato.create({
      data: {
        tenant_id: tenantId,
        ...payload,
      },
    });
  }

  async analizar(tenantId: string, transcribirVideo = false) {
    const perfil = await this.prisma.perfilCandidato.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!perfil) {
      throw new NotFoundException('No existe perfil de candidato para este tenant');
    }

    let transcripcion = perfil.video_transcripcion || '';

    if (transcribirVideo && perfil.video_url) {
      transcripcion = await this.transcripcion.transcribirVideo(perfil.video_url);
      await this.prisma.perfilCandidato.update({
        where: { tenant_id: tenantId },
        data: { video_transcripcion: transcripcion },
      });
    }

    const huella = await this.anthropic.analizarCandidato(
      perfil.discurso || '',
      transcripcion || '',
    );

    const updated = await this.prisma.perfilCandidato.update({
      where: { tenant_id: tenantId },
      data: {
        palabras_clave: huella.palabras_clave,
        muletillas: huella.muletillas,
        frases_recurrentes: huella.frases_recurrentes,
        llamados_accion: huella.llamados_accion,
        tono: huella.tono,
        propuesta_central: huella.propuesta_central,
        estilo_redes: huella.estilo_redes,
        metadata: huella as any,
        analizado_en: new Date(),
      },
    });

    return updated;
  }

  async generarContenido(
    tenantId: string,
    tipo: 'boletin' | 'redes',
    contexto: ContextoGeneracion,
  ) {
    const perfil = await this.prisma.perfilCandidato.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!perfil) {
      throw new NotFoundException('No existe perfil de candidato para este tenant');
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

    return this.anthropic.generarConHuella(huella, {
      perfil: {
        nombre: perfil.nombre || undefined,
        biografia: perfil.biografia || undefined,
        gustos: perfil.gustos || undefined,
        propuesta_central: perfil.propuesta_central || undefined,
      },
      tipo,
      contexto,
    });
  }
}

export interface ContextoGeneracion {
  tema?: string;
  que?: string;
  quien?: string;
  como?: string;
  cuando?: string;
  donde?: string;
  por_que?: string;
  para_que?: string;
}
