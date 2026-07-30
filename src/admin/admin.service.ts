import { Injectable, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async limpiarCapasExternas() {
    const tiposExternos = ['inegi', 'colonia'] as const;
    const resultado = await this.prisma.capaMapa.deleteMany({
      where: { tipo: { in: tiposExternos as unknown as any } },
    });
    this.logger.log(`Limpieza de capas externas: ${resultado.count} eliminadas`);
    return {
      eliminadas: resultado.count,
      tipos: tiposExternos,
      mensaje: `Se eliminaron ${resultado.count} capas de fuentes externas (INEGI/SEPOMEX/Nominatim).`,
    };
  }

  async createProject(data: {
    slug: string;
    nombre_candidato: string;
    cargo_busca?: string;
    slogan?: string;
    owner_email: string;
    owner_nombre: string;
    owner_password: string;
  }) {
    const slug = data.slug.trim().toLowerCase();
    const email = data.owner_email.trim().toLowerCase();

    // Validar que el slug no exista
    const existenteSlug = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (existenteSlug) {
      throw new BadRequestException('Ya existe un proyecto con ese slug');
    }

    // Validar que el email del owner no exista
    const existenteEmail = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (existenteEmail) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          slug,
          url_completa: '',
          nombre_candidato: data.nombre_candidato.trim(),
          cargo_busca: data.cargo_busca?.trim() || null,
          slogan: data.slogan?.trim() || null,
          plan: 'basico',
          activo: true,
        },
      });

      // 2. Crear perfil del candidato vacío
      await tx.perfilCandidato.create({
        data: {
          tenant_id: tenant.id,
        },
      });

      // 3. Crear usuario owner
      const owner = await tx.usuario.create({
        data: {
          tenant_id: tenant.id,
          email,
          nombre: data.owner_nombre.trim(),
          password_hash: await bcrypt.hash(data.owner_password, 10),
          rol: 'owner',
          activo: true,
          permisos: [
            'dashboard',
            'votantes',
            'crm',
            'eventos',
            'mapa',
            'boletines',
            'llamadas',
            'candidato',
            'encuestas',
            'casillas',
            'monitoreo',
            'proyeccion',
            'ficha_seccional',
            'historico_electoral',
            'usuarios',
            'app_brigada',
          ],
        },
      });

      this.logger.log(`Proyecto creado: ${tenant.slug} (${tenant.id}) con owner ${owner.email}`);

      return {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          nombre_candidato: tenant.nombre_candidato,
          cargo_busca: tenant.cargo_busca,
          slogan: tenant.slogan,
          plan: tenant.plan,
          activo: tenant.activo,
          created_at: tenant.created_at,
        },
        owner: {
          id: owner.id,
          email: owner.email,
          nombre: owner.nombre,
          rol: owner.rol,
        },
      };
    });
  }

  async listProjects() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            usuarios: true,
            votantes: true,
            lideres: true,
            eventos: true,
          },
        },
      },
    });

    return tenants.map((t) => ({
      id: t.id,
      slug: t.slug,
      dominio_personalizado: t.dominio_personalizado,
      nombre_candidato: t.nombre_candidato,
      cargo_busca: t.cargo_busca,
      slogan: t.slogan,
      foto_url: t.foto_url,
      plan: t.plan,
      activo: t.activo,
      created_at: t.created_at,
      stats: {
        usuarios: t._count.usuarios,
        votantes: t._count.votantes,
        lideres: t._count.lideres,
        eventos: t._count.eventos,
      },
    }));
  }

  async getProject(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        usuarios: {
          select: {
            id: true,
            email: true,
            nombre: true,
            rol: true,
            activo: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
        },
        _count: {
          select: {
            votantes: true,
            lideres: true,
            eventos: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new BadRequestException('Proyecto no encontrado');
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      dominio_personalizado: tenant.dominio_personalizado,
      nombre_candidato: tenant.nombre_candidato,
      cargo_busca: tenant.cargo_busca,
      slogan: tenant.slogan,
      foto_url: tenant.foto_url,
      plan: tenant.plan,
      activo: tenant.activo,
      created_at: tenant.created_at,
      usuarios: tenant.usuarios,
      stats: {
        votantes: tenant._count.votantes,
        lideres: tenant._count.lideres,
        eventos: tenant._count.eventos,
      },
    };
  }

  async updateProject(
    id: string,
    data: {
      nombre_candidato?: string;
      cargo_busca?: string;
      slogan?: string;
      dominio_personalizado?: string;
      foto_url?: string;
      plan?: string;
      activo?: boolean;
    },
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new BadRequestException('Proyecto no encontrado');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        nombre_candidato: data.nombre_candidato,
        cargo_busca: data.cargo_busca,
        slogan: data.slogan,
        dominio_personalizado: data.dominio_personalizado,
        foto_url: data.foto_url,
        plan: data.plan,
        activo: data.activo,
      },
    });

    // Sincronizar la foto del candidato al perfil del candidato para que se vea como bandera del proyecto
    if (data.foto_url !== undefined) {
      await this.prisma.perfilCandidato.updateMany({
        where: { tenant_id: id },
        data: { foto_url: data.foto_url || null },
      });
    }

    this.logger.log(`Proyecto actualizado: ${updated.slug} (${updated.id})`);

    return {
      id: updated.id,
      slug: updated.slug,
      dominio_personalizado: updated.dominio_personalizado,
      nombre_candidato: updated.nombre_candidato,
      cargo_busca: updated.cargo_busca,
      slogan: updated.slogan,
      foto_url: updated.foto_url,
      plan: updated.plan,
      activo: updated.activo,
      created_at: updated.created_at,
    };
  }

  async deleteProject(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new BadRequestException('Proyecto no encontrado');
    }

    // Proteger únicamente el proyecto del sistema donde vive el superadmin global
    if (tenant.slug === 'sistema-admin' || tenant.slug === 'sistema') {
      throw new ForbiddenException('No se puede eliminar el proyecto del sistema');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Romper relaciones recursivas/cruzadas que puedan bloquear el borrado en cascada
        await tx.$executeRawUnsafe(`UPDATE "zonas" SET "lider_id" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "lideres" SET "lider_padre_id" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "eventos" SET "zona_id" = NULL, "lider_id" = NULL, "created_by" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "apoyos" SET "entregado_por" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "mensajes" SET "atendido_por" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "peticiones" SET "responsable_id" = NULL, "created_by" = NULL, "votante_id" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "evidencias_peticion" SET "created_by" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "historial_peticiones" SET "created_by" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "boletines" SET "aprobado_por" = NULL, "created_by" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "campanas_vapi" SET "created_by" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "encuestas" SET "created_by" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "respuestas_encuesta" SET "created_by" = NULL, "votante_id" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "casillas" SET "responsable_id" = NULL WHERE "tenant_id" = $1::uuid`, id);
        await tx.$executeRawUnsafe(`UPDATE "metas_votacion" SET "zona_id" = NULL WHERE "tenant_id" = $1::uuid`, id);

        // 2. Eliminar el tenant; Prisma borra en cascada todas las relaciones con onDelete: Cascade
        await tx.tenant.delete({ where: { id } });
      }, { timeout: 120000 }); // hasta 2 min para proyectos grandes

      this.logger.log(`Proyecto eliminado: ${tenant.slug} (${id})`);

      return {
        ok: true,
        mensaje: `Proyecto "${tenant.nombre_candidato}" y todos sus datos fueron eliminados definitivamente.`,
      };
    } catch (err: any) {
      this.logger.error(`Error al eliminar proyecto ${id}: ${err.message}`, err.stack);
      throw new BadRequestException(
        err.message?.includes('foreign key')
          ? 'No se pudo eliminar el proyecto porque tiene datos vinculados que no se pudieron limpiar automáticamente. Contacta soporte.'
          : 'Error al eliminar el proyecto: ' + err.message,
      );
    }
  }

  private colorPorPartido(partido?: string | null): string {
    if (!partido) return '#9CA3AF';
    const p = String(partido).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const colores: Record<string, string> = {
      PRI: '#EF4444',
      PAN: '#3B82F6',
      MORENA: '#7C2D12',
      PRD: '#FACC15',
      'VERDE ECOLOGISTA': '#22C55E',
      PVEM: '#22C55E',
      VERDE: '#22C55E',
      INDEPENDIENTE: '#D946EF',
    };
    for (const [key, color] of Object.entries(colores)) {
      if (p.includes(key)) return color;
    }
    return '#9CA3AF';
  }

  async duplicarCapasSeccionesPorHistorico(tenantId: string, capaId?: string) {
    const anios = [2021, 2024, 2028];

    let capaBase: any = null;
    if (capaId) {
      capaBase = await this.prisma.capaMapa.findFirst({
        where: { id: capaId, tenant_id: tenantId },
      });
    } else {
      const capas = await this.prisma.capaMapa.findMany({
        where: { tenant_id: tenantId },
        orderBy: { created_at: 'desc' },
      });
      capaBase = capas.find((c: any) => {
        const nombre = String(c.nombre || '').toLowerCase();
        return nombre.includes('seccion') || nombre.includes('sección') || nombre.includes('ine') || c.tipo === 'ine';
      }) || capas[0];
    }

    if (!capaBase) {
      throw new BadRequestException('No se encontró una capa base para duplicar');
    }

    const geojson = (capaBase.geojson as any) || { type: 'FeatureCollection', features: [] };
    if (!Array.isArray(geojson.features)) {
      throw new BadRequestException('La capa base no tiene un GeoJSON válido');
    }

    // Precargar históricos del tenant por sección y año
    const historicos = await this.prisma.resultadoHistorico.findMany({
      where: { tenant_id: tenantId, anio: { in: anios } },
    });

    const historicoPorSeccionYAnio = new Map<string, any>();
    for (const h of historicos) {
      const seccion = String(h.seccion || '').padStart(4, '0').slice(0, 4);
      const key = `${seccion}|${h.anio}`;
      const existente = historicoPorSeccionYAnio.get(key);
      if (!existente) {
        historicoPorSeccionYAnio.set(key, { ...h, total_votos: h.total_votos || 0 });
      } else {
        existente.total_votos += h.total_votos || 0;
        if ((h.votos_ganador || 0) > (existente.votos_ganador || 0)) {
          existente.partido_ganador = h.partido_ganador;
          existente.votos_ganador = h.votos_ganador;
        }
      }
    }

    const creadas: any[] = [];

    for (const anio of anios) {
      const estilos: Record<string, any> = {};
      let conHistorico = 0;
      let sinHistorico = 0;

      for (const feature of geojson.features) {
        const props = feature?.properties || {};
        const seccionRaw = props.seccion || props.SECCION || props.Seccion || props.sección;
        if (!seccionRaw) {
          sinHistorico++;
          continue;
        }
        const seccion = String(seccionRaw).replace(/\D/g, '').padStart(4, '0').slice(0, 4);
        const idFeature = String(props._feature_id || props.id || props.ID || props.OBJECTID || props.objectid || props.FID || props.fid || props.gid || props.GID || Math.random().toString(36).slice(2));

        const hist = historicoPorSeccionYAnio.get(`${seccion}|${anio}`);
        const color = this.colorPorPartido(hist?.partido_ganador);
        if (hist) conHistorico++;
        else sinHistorico++;

        estilos[idFeature] = {
          color,
          nombre: `${props._feature_nombre || props.nombre || props.NOMBRE || props.seccion || seccion} (${anio})`,
          metadata: { anio_historico: anio, partido_ganador: hist?.partido_ganador || null },
        };
      }

      const nuevaCapa = await this.prisma.capaMapa.create({
        data: {
          tenant_id: tenantId,
          nombre: `${capaBase.nombre} - ${anio}`,
          tipo: capaBase.tipo || 'custom',
          origen: 'propia',
          color: '#9CA3AF',
          visible: true,
          bloqueada: false,
          orden: capaBase.orden || 0,
          geojson,
          metadata: { ...(capaBase.metadata || {}), anio_historico: anio, capa_base_id: capaBase.id },
          estilos,
        },
      });

      creadas.push({
        id: nuevaCapa.id,
        nombre: nuevaCapa.nombre,
        anio,
        conHistorico,
        sinHistorico,
      });
    }

    return {
      ok: true,
      capaBase: { id: capaBase.id, nombre: capaBase.nombre },
      capasCreadas: creadas,
    };
  }
}
