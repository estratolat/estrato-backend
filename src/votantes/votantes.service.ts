import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class VotantesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    return this.prisma.votante.findMany({
      where: { activo: true },
      take: query.limit ? parseInt(query.limit) : 100,
    });
  }

  async findOne(id: string) {
    return this.prisma.votante.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.votante.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.votante.update({
      where: { id },
      data,
    });
  }
}
