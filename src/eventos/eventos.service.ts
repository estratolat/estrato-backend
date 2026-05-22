import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class EventosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.evento.findMany();
  }

  async findOne(id: string) {
    return this.prisma.evento.findUnique({
      where: { id },
      include: { asistencias: { include: { votante: true } } },
    });
  }

  async create(data: any) {
    return this.prisma.evento.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.evento.update({
      where: { id },
      data,
    });
  }

  async registrarAsistencia(eventoId: string, data: any) {
    return this.prisma.asistencia.create({
      data: {
        ...data,
        evento_id: eventoId,
      },
    });
  }
}
