import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class IneService {
  constructor(private prisma: PrismaService) {}

  async getBitacora() {
    return this.prisma.bitacoraINE.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async registrar(data: any) {
    return this.prisma.bitacoraINE.create({ data });
  }
}
