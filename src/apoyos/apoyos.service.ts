import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class ApoyosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    return this.prisma.apoyo.findMany({
      take: query.limit ? parseInt(query.limit) : 100,
    });
  }

  async create(data: any) {
    return this.prisma.apoyo.create({ data });
  }
}
