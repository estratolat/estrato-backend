import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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
}
