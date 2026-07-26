import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { TipoPeticion, OrigenPeticion, CategoriaPeticion, PrioridadPeticion, EstatusPeticion } from '@prisma/client';

const TIPOS = Object.values(TipoPeticion);
const ORIGENES = Object.values(OrigenPeticion);
const CATEGORIAS = Object.values(CategoriaPeticion);
const PRIORIDADES = Object.values(PrioridadPeticion);
const ESTATUS = Object.values(EstatusPeticion);

export interface PeticionQuery {
  estatus?: string;
  categoria?: string;
  prioridad?: string;
  tipo?: string;
  origen?: string;
  responsable_id?: string;
  zona_id?: string;
  solo_mias?: string;
  limit?: string;
}

export interface PeticionUserContext {
  id: string;
  rol: string;
  zona_id?: string | null;
}

@Injectable()
export class PeticionesService {
  constructor(private prisma: PrismaService) {}

  private buildWhere(query: PeticionQuery, tenantId: string, user: PeticionUserContext) {
    const where: any = { tenant_id: tenantId };

    if (query.estatus && ESTATUS.includes(query.estatus as EstatusPeticion)) {
      where.estatus = query.estatus;
    }
    if (query.categoria && CATEGORIAS.includes(query.categoria as CategoriaPeticion)) {
      where.categoria = query.categoria;
    }
    if (query.prioridad && PRIORIDADES.includes(query.prioridad as PrioridadPeticion)) {
      where.prioridad = query.prioridad;
    }
    if (query.tipo && TIPOS.includes(query.tipo as TipoPeticion)) {
      where.tipo = query.tipo;
    }
    if (query.origen && ORIGENES.includes(query.origen as OrigenPeticion)) {
      where.origen = query.origen;
    }
    if (query.responsable_id) {
      where.responsable_id = query.responsable_id;
    }

    // Aislamiento de datos según rol
    if (user.rol === 'brigadista' || user.rol === 'encargado_peticiones' || query.solo_mias === 'true') {
      // Solo ven peticiones asignadas a ellos
      where.responsable_id = user.id;
    } else if (user.rol === 'coord_zona') {
      // Coordinador zonal: peticiones de usuarios de su zona o sin zona asignada
      if (user.zona_id) {
        where.OR = [
          { responsable: { zona_id: user.zona_id } },
          { responsable_id: null },
        ];
      }
    }
    // owner, candidato, coord_general, superadmin ven todo

    return where;
  }

  async findAll(query: PeticionQuery, tenantId: string, user: PeticionUserContext) {
    const where = this.buildWhere(query, tenantId, user);

    return this.prisma.peticion.findMany({
      where,
      take: query.limit ? parseInt(query.limit, 10) : 500,
      orderBy: [{ fecha_compromiso: 'asc' }, { created_at: 'desc' }],
      include: {
        votante: { select: { id: true, nombre: true, telefono: true } },
        creador: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true, zona_id: true, rol: true } },
        evidencias: { take: 5, orderBy: { created_at: 'desc' } },
        _count: { select: { evidencias: true, historial: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string, user: PeticionUserContext) {
    const peticion = await this.prisma.peticion.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        votante: { select: { id: true, nombre: true, telefono: true } },
        creador: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true, zona_id: true, rol: true } },
        evidencias: { orderBy: { created_at: 'desc' } },
        historial: {
          orderBy: { created_at: 'desc' },
          include: { creador: { select: { id: true, nombre: true } } },
        },
      },
    });

    if (!peticion) throw new NotFoundException('Petición no encontrada');
    this.verificarAcceso(peticion, user);

    return peticion;
  }

  async create(data: any, tenantId: string, userId: string, userRol: string) {
    const tipo = TIPOS.includes(data.tipo) ? data.tipo : 'ciudadana';
    const origen = ORIGENES.includes(data.origen) ? data.origen : 'manual';
    const categoria = CATEGORIAS.includes(data.categoria) ? data.categoria : 'otro';
    const prioridad = PRIORIDADES.includes(data.prioridad) ? data.prioridad : 'media';

    // Brigadistas solo pueden crear propuestas ciudadanas desde la app
    let estatus: EstatusPeticion = EstatusPeticion.propuesta;
    if (userRol === 'brigadista') {
      estatus = EstatusPeticion.propuesta;
    } else if (ESTATUS.includes(data.estatus)) {
      estatus = data.estatus;
    }

    // Solo roles con permiso de asignar pueden crear peticiones ya aprobadas/pendientes
    const puedeAprobar = !['brigadista'].includes(userRol);
    if (!puedeAprobar && estatus !== EstatusPeticion.propuesta) {
      estatus = EstatusPeticion.propuesta;
    }

    const payload: any = {
      tenant_id: tenantId,
      created_by: userId,
      folio: await this.generarFolio(tenantId),
      votante_id: data.votante_id || null,
      responsable_id: data.responsable_id || null,
      tipo,
      origen,
      categoria,
      prioridad,
      estatus,
      titulo: data.titulo ? String(data.titulo).trim() : null,
      descripcion: String(data.descripcion || '').trim(),
      seccion_electoral: data.seccion_electoral ? String(data.seccion_electoral).trim() : null,
      coordenadas: data.coordenadas || null,
      ubicacion_texto: data.ubicacion_texto ? String(data.ubicacion_texto).trim() : null,
      fecha_compromiso: data.fecha_compromiso ? new Date(data.fecha_compromiso) : null,
      fecha_resolucion: null,
      requiere_evidencia: data.requiere_evidencia !== false,
    };

    if (!payload.descripcion) {
      throw new BadRequestException('La descripción de la petición es requerida');
    }

    const peticion = await this.prisma.peticion.create({
      data: payload,
      include: {
        votante: { select: { id: true, nombre: true } },
        creador: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true } },
      },
    });

    await this.registrarHistorial(
      peticion.id,
      tenantId,
      userId,
      null,
      peticion.estatus,
      'Petición creada'
    );

    return peticion;
  }

  async update(id: string, data: any, tenantId: string, user: PeticionUserContext) {
    const peticion = await this.prisma.peticion.findFirst({
      where: { id, tenant_id: tenantId },
      include: { responsable: { select: { id: true, zona_id: true, rol: true } } },
    });
    if (!peticion) throw new NotFoundException('Petición no encontrada');
    this.verificarAccesoEdicion(peticion, user);

    const payload: any = {};
    if (data.titulo !== undefined) payload.titulo = String(data.titulo).trim() || null;
    if (data.descripcion !== undefined) payload.descripcion = String(data.descripcion).trim();
    if (data.votante_id !== undefined) payload.votante_id = data.votante_id || null;
    if (data.responsable_id !== undefined) payload.responsable_id = data.responsable_id || null;
    if (data.tipo !== undefined && TIPOS.includes(data.tipo)) payload.tipo = data.tipo;
    if (data.categoria !== undefined && CATEGORIAS.includes(data.categoria)) payload.categoria = data.categoria;
    if (data.prioridad !== undefined && PRIORIDADES.includes(data.prioridad)) payload.prioridad = data.prioridad;
    if (data.seccion_electoral !== undefined) payload.seccion_electoral = String(data.seccion_electoral).trim() || null;
    if (data.coordenadas !== undefined) payload.coordenadas = data.coordenadas || null;
    if (data.ubicacion_texto !== undefined) payload.ubicacion_texto = String(data.ubicacion_texto).trim() || null;
    if (data.fecha_compromiso !== undefined) payload.fecha_compromiso = data.fecha_compromiso ? new Date(data.fecha_compromiso) : null;
    if (data.requiere_evidencia !== undefined) payload.requiere_evidencia = Boolean(data.requiere_evidencia);

    if (data.descripcion !== undefined && !payload.descripcion) {
      throw new BadRequestException('La descripción de la petición es requerida');
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    const actualizada = await this.prisma.peticion.update({
      where: { id },
      data: payload,
      include: {
        votante: { select: { id: true, nombre: true } },
        creador: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true } },
      },
    });

    await this.registrarHistorial(
      id,
      tenantId,
      user.id,
      peticion.estatus,
      actualizada.estatus,
      'Petición actualizada'
    );

    return actualizada;
  }

  async updateEstatus(id: string, estatus: string, tenantId: string, user: PeticionUserContext, comentario?: string) {
    if (!ESTATUS.includes(estatus as EstatusPeticion)) {
      throw new BadRequestException('Estatus inválido');
    }

    const peticion = await this.prisma.peticion.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        responsable: { select: { id: true, zona_id: true, rol: true } },
        evidencias: { select: { id: true } },
      },
    });
    if (!peticion) throw new NotFoundException('Petición no encontrada');
    this.verificarAccesoEdicion(peticion, user);

    const nuevoEstatus = estatus as EstatusPeticion;

    // Validar transiciones
    this.validarTransicion(peticion.estatus, nuevoEstatus, peticion.requiere_evidencia, peticion.evidencias.length);

    const payload: any = { estatus: nuevoEstatus };
    if (nuevoEstatus === EstatusPeticion.resuelta) {
      payload.fecha_resolucion = new Date();
    }

    const actualizada = await this.prisma.peticion.update({
      where: { id },
      data: payload,
      include: {
        votante: { select: { id: true, nombre: true } },
        creador: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true } },
      },
    });

    await this.registrarHistorial(
      id,
      tenantId,
      user.id,
      peticion.estatus,
      nuevoEstatus,
      comentario || `Estatus cambiado a ${nuevoEstatus}`
    );

    return actualizada;
  }

  async addEvidencia(peticionId: string, data: any, tenantId: string, userId: string, user: PeticionUserContext) {
    const peticion = await this.prisma.peticion.findFirst({
      where: { id: peticionId, tenant_id: tenantId },
      include: { responsable: { select: { id: true, zona_id: true, rol: true } } },
    });
    if (!peticion) throw new NotFoundException('Petición no encontrada');
    this.verificarAccesoEdicion(peticion, user);

    if (!data.imagen_url) {
      throw new BadRequestException('La imagen es requerida');
    }

    const evidencia = await this.prisma.evidenciaPeticion.create({
      data: {
        tenant_id: tenantId,
        peticion_id: peticionId,
        imagen_url: String(data.imagen_url).trim(),
        latitud: data.latitud != null ? Number(data.latitud) : null,
        longitud: data.longitud != null ? Number(data.longitud) : null,
        distancia_m: data.distancia_m != null ? Number(data.distancia_m) : null,
        comentario: data.comentario ? String(data.comentario).trim() : null,
        created_by: userId,
      },
      include: { creador: { select: { id: true, nombre: true } } },
    });

    await this.registrarHistorial(
      peticionId,
      tenantId,
      userId,
      peticion.estatus,
      peticion.estatus,
      'Evidencia fotográfica agregada'
    );

    return evidencia;
  }

  async remove(id: string, tenantId: string, user: PeticionUserContext) {
    const peticion = await this.prisma.peticion.findFirst({
      where: { id, tenant_id: tenantId },
      include: { responsable: { select: { id: true, zona_id: true, rol: true } } },
    });
    if (!peticion) throw new NotFoundException('Petición no encontrada');

    // Solo owner, candidato, coord_general y el creador pueden eliminar
    const puedeEliminar = ['owner', 'candidato', 'coord_general', 'superadmin'].includes(user.rol) || peticion.created_by === user.id;
    if (!puedeEliminar) {
      throw new ForbiddenException('No tienes permiso para eliminar esta petición');
    }

    await this.prisma.peticion.delete({ where: { id } });
    return { message: 'Petición eliminada' };
  }

  private verificarAcceso(peticion: any, user: PeticionUserContext) {
    if (['owner', 'candidato', 'coord_general', 'superadmin'].includes(user.rol)) return;

    if (user.rol === 'brigadista' || user.rol === 'encargado_peticiones') {
      if (peticion.responsable_id !== user.id) {
        throw new ForbiddenException('No tienes acceso a esta petición');
      }
      return;
    }

    if (user.rol === 'coord_zona') {
      if (peticion.responsable?.zona_id && peticion.responsable.zona_id !== user.zona_id) {
        throw new ForbiddenException('No tienes acceso a peticiones de otra zona');
      }
      return;
    }
  }

  private verificarAccesoEdicion(peticion: any, user: PeticionUserContext) {
    if (['owner', 'candidato', 'coord_general', 'superadmin'].includes(user.rol)) return;

    if (user.rol === 'brigadista' || user.rol === 'encargado_peticiones') {
      if (peticion.responsable_id !== user.id) {
        throw new ForbiddenException('No puedes editar esta petición');
      }
      return;
    }

    if (user.rol === 'coord_zona') {
      if (peticion.responsable?.zona_id && peticion.responsable.zona_id !== user.zona_id) {
        throw new ForbiddenException('No puedes editar peticiones de otra zona');
      }
      return;
    }
  }

  private validarTransicion(anterior: EstatusPeticion, nuevo: EstatusPeticion, requiereEvidencia: boolean, cantidadEvidencias: number) {
    // Reglas básicas de flujo
    if (anterior === EstatusPeticion.resuelta && nuevo !== EstatusPeticion.resuelta) {
      // Permitir reabrir una petición resuelta por error
      return;
    }

    if (anterior === EstatusPeticion.cancelada && nuevo !== EstatusPeticion.cancelada) {
      // No se puede reactivar una cancelada sin permisos especiales (lo maneja el rol)
      return;
    }

    if (nuevo === EstatusPeticion.resuelta && requiereEvidencia && cantidadEvidencias === 0) {
      throw new BadRequestException('No se puede marcar como resuelta sin evidencia fotográfica');
    }
  }

  private async registrarHistorial(
    peticionId: string,
    tenantId: string,
    userId: string,
    estatusAnterior: EstatusPeticion | null,
    estatusNuevo: EstatusPeticion,
    comentario?: string
  ) {
    await this.prisma.historialPeticion.create({
      data: {
        tenant_id: tenantId,
        peticion_id: peticionId,
        estatus: String(estatusNuevo),
        estatus_anterior: estatusAnterior ? String(estatusAnterior) : null,
        estatus_nuevo: String(estatusNuevo),
        comentario: comentario || null,
        created_by: userId,
      },
    });
  }

  private async generarFolio(tenantId: string): Promise<string> {
    const prefijo = 'PET';
    const anio = new Date().getFullYear().toString().slice(-2);
    // Contar peticiones del tenant para generar número secuencial
    const count = await this.prisma.peticion.count({ where: { tenant_id: tenantId } });
    const numero = (count + 1).toString().padStart(5, '0');
    return `${prefijo}-${anio}-${numero}`;
  }
}
