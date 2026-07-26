import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateOpositorDto } from './dto/create-opositor.dto';
import { UpdateOpositorDto } from './dto/update-opositor.dto';

@Injectable()
export class OpositoresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.opositor.findMany({
      where: { tenant_id: tenantId, activo: true },
      orderBy: [{ nivel_rivalidad: 'asc' }, { created_at: 'asc' }],
    });
  }

  async create(tenantId: string, dto: CreateOpositorDto) {
    return this.prisma.opositor.create({
      data: {
        tenant_id: tenantId,
        nombre: dto.nombre,
        partido: dto.partido || null,
        foto_url: dto.foto_url || null,
        nivel_rivalidad: dto.nivel_rivalidad,
        redes_sociales: (dto.redes_sociales || []) as any,
        descripcion: dto.descripcion || null,
        ficha_negativa: dto.ficha_negativa || null,
        notas: dto.notas || null,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateOpositorDto) {
    const opositor = await this.prisma.opositor.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!opositor) throw new NotFoundException('Opositor no encontrado');

    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.partido !== undefined) data.partido = dto.partido || null;
    if (dto.foto_url !== undefined) data.foto_url = dto.foto_url || null;
    if (dto.nivel_rivalidad !== undefined) data.nivel_rivalidad = dto.nivel_rivalidad;
    if (dto.redes_sociales !== undefined) data.redes_sociales = (dto.redes_sociales || []) as any;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion || null;
    if (dto.ficha_negativa !== undefined) data.ficha_negativa = dto.ficha_negativa || null;
    if (dto.notas !== undefined) data.notas = dto.notas || null;

    return this.prisma.opositor.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    const opositor = await this.prisma.opositor.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!opositor) throw new NotFoundException('Opositor no encontrado');

    return this.prisma.opositor.update({
      where: { id },
      data: { activo: false },
    });
  }
}
