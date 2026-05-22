import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class RecorridosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.recorrido.findMany();
  }

  async create(data: any) {
    return this.prisma.recorrido.create({ data });
  }
}
