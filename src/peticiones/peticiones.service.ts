import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CategoriaPeticion, PrioridadPeticion, EstatusPeticion } from '@prisma/client';

const CATEGORIAS = Object.values(CategoriaPeticion);
const PRIORIDADES = Object.values(PrioridadPeticion);
const ESTATUS = Object.values(EstatusPeticion);

@Injectable()
export class PeticionesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any, tenantId: string) {
    const where: any = { tenant_id: tenantId };
    if (query.estatus && ESTATUS.includes(query.estatus)) where.estatus = query.estatus;
    if (query.categoria && CATEGORIAS.includes(query.categoria)) where.categoria = query.categoria;
    if (query.prioridad && PRIORIDADES.includes(query.prioridad)) where.prioridad = query.prioridad;

    return this.prisma.peticion.findMany({
      where,
      take: query.limit ? parseInt(query.limit, 10) : 500,
      orderBy: { created_at: 'desc' },
      include: {
        votante: { select: { id: true, nombre: true, telefono: true } },
        creador: { select: { id: true, nombre: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const peticion = await this.prisma.peticion.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        votante: { select: { id: true, nombre: true, telefono: true } },
        creador: { select: { id: true, nombre: true } },
      },
    });
    if (!peticion) throw new NotFoundException('Petición no encontrada');
    return peticion;
  }

  async create(data: any, tenantId: string, userId: string) {
    const categoria = CATEGORIAS.includes(data.categoria) ? data.categoria : 'otro';
    const prioridad = PRIORIDADES.includes(data.prioridad) ? data.prioridad : 'media';

    const payload: any = {
      tenant_id: tenantId,
      created_by: userId,
      categoria,
      prioridad,
      estatus: 'reportada',
      titulo: data.titulo ? String(data.titulo).trim() : null,
      descripcion: String(data.descripcion || '').trim(),
      coordenadas: data.coordenadas || null,
      foto_url: data.foto_url ? String(data.foto_url).trim() : null,
    };

    if (data.votante_id) payload.votante_id = data.votante_id;

    if (!payload.descripcion) {
      throw new BadRequestException('La descripción de la petición es requerida');
    }

    return this.prisma.peticion.create({
      data: payload,
      include: {
        votante: { select: { id: true, nombre: true } },
        creador: { select: { id: true, nombre: true } },
      },
    });
  }

  async updateEstatus(id: string, estatus: string, tenantId: string) {
    if (!ESTATUS.includes(estatus as any)) {
      throw new BadRequestException('Estatus inválido');
    }

    await this.findOne(id, tenantId);

    return this.prisma.peticion.update({
      where: { id },
      data: { estatus: estatus as EstatusPeticion },
      include: {
        votante: { select: { id: true, nombre: true } },
        creador: { select: { id: true, nombre: true } },
      },
    });
  }
}
