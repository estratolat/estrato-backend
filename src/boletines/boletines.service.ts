import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class BoletinesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.boletin.findMany();
  }

  async create(data: any) {
    return this.prisma.boletin.create({ data });
  }

  async aprobar(id: string) {
    return this.prisma.boletin.update({
      where: { id },
      data: { aprobado: true },
    });
  }

  async rechazar(id: string) {
    return this.prisma.boletin.update({
      where: { id },
      data: { aprobado: false },
    });
  }
}
