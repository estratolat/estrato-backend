import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async getOrThrow(slug: string) {
    const tenant = await this.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Tenant ${slug} no encontrado`);
    }
    return tenant;
  }

  async create(data: {
    slug: string;
    nombre_candidato: string;
    cargo_busca?: string;
    slogan?: string;
    plan?: string;
  }) {
    return this.prisma.tenant.create({
      data: {
        ...data,
        plan: data.plan || 'basico',
        activo: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async toggleVeda(id: string, veda_activa: boolean) {
    return this.prisma.tenant.update({
      where: { id },
      data: { veda_activa },
    });
  }

  async getStats(tenantId: string) {
    const [
      totalVotantes,
      totalLideres,
      totalEventos,
      totalApoyos,
      apoyosMes,
    ] = await Promise.all([
      this.prisma.votante.count({ where: { tenant_id: tenantId } }),
      this.prisma.lider.count({ where: { tenant_id: tenantId } }),
      this.prisma.evento.count({ where: { tenant_id: tenantId } }),
      this.prisma.apoyo.count({ where: { tenant_id: tenantId } }),
      this.prisma.apoyo.count({
        where: {
          tenant_id: tenantId,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalVotantes,
      totalLideres,
      totalEventos,
      totalApoyos,
      apoyosMes,
    };
  }
}
