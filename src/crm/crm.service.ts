import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async getMensajes(filters: any) {
    return this.prisma.mensaje.findMany({
      take: filters.limit ? parseInt(filters.limit) : 50,
      orderBy: { created_at: 'desc' },
    });
  }

  async enviarMensaje(data: any) {
    return this.prisma.mensaje.create({ data });
  }

  async getStats() {
    const total = await this.prisma.mensaje.count();
    const pendientes = await this.prisma.mensaje.count({
      where: { leido: false },
    });
    return { total, pendientes };
  }
}
