import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class LideresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.lider.findMany();
  }

  async findOne(id: string) {
    return this.prisma.lider.findUnique({
      where: { id },
      include: { votante: true, lideresHijos: true },
    });
  }

  async create(data: any) {
    return this.prisma.lider.create({ data });
  }

  async updateScore(id: string, score: number) {
    return this.prisma.lider.update({
      where: { id },
      data: { score },
    });
  }
}
