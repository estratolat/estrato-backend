"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const tenants_service_1 = require("../tenants/tenants.service");
const bcrypt = __importStar(require("bcryptjs"));
let AdminService = AdminService_1 = class AdminService {
    constructor(prisma, tenantsService) {
        this.prisma = prisma;
        this.tenantsService = tenantsService;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async limpiarCapasExternas() {
        const tiposExternos = ['inegi', 'colonia'];
        const resultado = await this.prisma.capaMapa.deleteMany({
            where: { tipo: { in: tiposExternos } },
        });
        this.logger.log(`Limpieza de capas externas: ${resultado.count} eliminadas`);
        return {
            eliminadas: resultado.count,
            tipos: tiposExternos,
            mensaje: `Se eliminaron ${resultado.count} capas de fuentes externas (INEGI/SEPOMEX/Nominatim).`,
        };
    }
    async createProject(data) {
        const slug = data.slug.trim().toLowerCase();
        const email = data.owner_email.trim().toLowerCase();
        const existenteSlug = await this.prisma.tenant.findUnique({
            where: { slug },
        });
        if (existenteSlug) {
            throw new common_1.BadRequestException('Ya existe un proyecto con ese slug');
        }
        const existenteEmail = await this.prisma.usuario.findUnique({
            where: { email },
        });
        if (existenteEmail) {
            throw new common_1.BadRequestException('Ya existe un usuario con ese email');
        }
        return this.prisma.$transaction(async (tx) => {
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
            await tx.perfilCandidato.create({
                data: {
                    tenant_id: tenant.id,
                },
            });
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
            nombre_candidato: t.nombre_candidato,
            cargo_busca: t.cargo_busca,
            slogan: t.slogan,
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
    async getProject(id) {
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
            throw new common_1.BadRequestException('Proyecto no encontrado');
        }
        return {
            id: tenant.id,
            slug: tenant.slug,
            nombre_candidato: tenant.nombre_candidato,
            cargo_busca: tenant.cargo_busca,
            slogan: tenant.slogan,
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenants_service_1.TenantsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map