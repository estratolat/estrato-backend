import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class VapiService {
  constructor(private prisma: PrismaService) {}

  async getCampanas() {
    return this.prisma.campanaVapi.findMany();
  }

  async createCampana(data: any) {
    return this.prisma.campanaVapi.create({ data });
  }

  async getLlamadas(campanaId: string) {
    return this.prisma.llamadaVapi.findMany({
      where: { campana_id: campanaId },
    });
  }
}
