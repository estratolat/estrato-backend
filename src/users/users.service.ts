import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      where: { activo: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.usuario.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.usuario.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.usuario.update({
      where: { id },
      data,
    });
  }
}
