import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class ApoyosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any, tenantId: string) {
    return this.prisma.apoyo.findMany({
      where: { tenant_id: tenantId },
      orderBy: { fecha_entrega: 'desc' },
      take: query.limit ? parseInt(query.limit) : 100,
      include: { votante: { select: { id: true, nombre: true, seccion_electoral: true } } },
    });
  }

  async create(data: any, tenantId: string, userId?: string) {
    if (!userId) {
      throw new BadRequestException('Usuario entregador no identificado');
    }

    const payload: any = {
      tenant_id: tenantId,
      votante_id: data.votante_id,
      tipo_apoyo: String(data.tipo_apoyo || '').trim(),
      cantidad: parseInt(data.cantidad, 10) || 1,
      observaciones: data.observaciones ? String(data.observaciones).trim() : null,
      entregado_por: userId,
      coordenadas: data.coordenadas || null,
    };

    if (data.foto_url) payload.foto_url = String(data.foto_url).trim();

    return this.prisma.apoyo.create({ data: payload });
  }
}
