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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = exports.SECCIONES_DISPONIBLES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const ROLES_VALIDOS = [
    'owner',
    'candidato',
    'coord_general',
    'coord_zona',
    'brigadista',
    'cm',
    'superadmin',
];
const PERMISOS_POR_ROL = {
    owner: [
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
        'inteligencia_electoral',
        'usuarios',
        'app_brigada',
    ],
    candidato: [
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
        'inteligencia_electoral',
        'usuarios',
        'app_brigada',
    ],
    coord_general: [
        'dashboard',
        'votantes',
        'crm',
        'eventos',
        'mapa',
        'boletines',
        'llamadas',
        'encuestas',
        'casillas',
        'monitoreo',
        'proyeccion',
        'ficha_seccional',
        'historico_electoral',
        'inteligencia_electoral',
        'app_brigada',
    ],
    coord_zona: [
        'dashboard',
        'votantes',
        'crm',
        'eventos',
        'mapa',
        'encuestas',
        'casillas',
        'monitoreo',
        'ficha_seccional',
        'app_brigada',
    ],
    brigadista: ['app_brigada'],
    cm: [
        'dashboard',
        'crm',
        'boletines',
        'candidato',
        'encuestas',
        'monitoreo',
        'proyeccion',
        'ficha_seccional',
        'historico_electoral',
        'inteligencia_electoral',
    ],
    superadmin: ['admin'],
};
exports.SECCIONES_DISPONIBLES = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'votantes', label: 'Votantes', icon: 'votantes' },
    { id: 'crm', label: 'CRM', icon: 'crm' },
    { id: 'eventos', label: 'Eventos', icon: 'eventos' },
    { id: 'mapa', label: 'Mapa Territorial', icon: 'mapa' },
    { id: 'boletines', label: 'Boletines IA', icon: 'boletines' },
    { id: 'llamadas', label: 'Llamadas', icon: 'llamadas' },
    { id: 'candidato', label: 'Perfil del Candidato', icon: 'user' },
    { id: 'encuestas', label: 'Encuestas', icon: 'crm' },
    { id: 'casillas', label: 'Casillas', icon: 'mapa' },
    { id: 'monitoreo', label: 'Monitoreo', icon: 'dashboard' },
    { id: 'proyeccion', label: 'Proyección', icon: 'historico' },
    { id: 'ficha_seccional', label: 'Ficha Seccional', icon: 'votantes' },
    { id: 'historico_electoral', label: 'Histórico Electoral', icon: 'historico' },
    { id: 'inteligencia_electoral', label: 'Inteligencia Electoral', icon: 'historico' },
    { id: 'usuarios', label: 'Configuración / Usuarios', icon: 'seguridad' },
    { id: 'app_brigada', label: 'App de Brigada', icon: 'app' },
];
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        return this.prisma.usuario.findMany({
            where: { tenant_id: tenantId },
            orderBy: [{ activo: 'desc' }, { created_at: 'desc' }],
            include: {
                zona: { select: { id: true, nombre: true } },
            },
        });
    }
    async findOne(id, tenantId) {
        const usuario = await this.prisma.usuario.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                zona: { select: { id: true, nombre: true } },
            },
        });
        if (!usuario)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return usuario;
    }
    async create(data, tenantId, creadorId) {
        const payload = await this.normalizar(data, tenantId, false, creadorId);
        const existente = await this.prisma.usuario.findUnique({
            where: { email: payload.email },
        });
        if (existente) {
            throw new common_1.BadRequestException('Ya existe un usuario con ese email');
        }
        return this.prisma.usuario.create({
            data: payload,
            include: { zona: { select: { id: true, nombre: true } } },
        });
    }
    async update(id, data, tenantId) {
        await this.findOne(id, tenantId);
        const payload = await this.normalizar(data, tenantId, true);
        if (payload.email) {
            const existente = await this.prisma.usuario.findFirst({
                where: { email: payload.email, id: { not: id } },
            });
            if (existente) {
                throw new common_1.BadRequestException('Ya existe otro usuario con ese email');
            }
        }
        return this.prisma.usuario.update({
            where: { id },
            data: payload,
            include: { zona: { select: { id: true, nombre: true } } },
        });
    }
    async remove(id, tenantId, ejecutorId) {
        if (id === ejecutorId) {
            throw new common_1.ForbiddenException('No puedes desactivar tu propio usuario');
        }
        await this.findOne(id, tenantId);
        return this.prisma.usuario.update({
            where: { id },
            data: { activo: false },
            include: { zona: { select: { id: true, nombre: true } } },
        });
    }
    permisosPorRol(rol) {
        return PERMISOS_POR_ROL[rol] || [];
    }
    async normalizar(data, tenantId, esUpdate = false, creadorId) {
        const payload = {};
        if (!esUpdate) {
            payload.tenant_id = tenantId;
            payload.activo = true;
        }
        if (data.email !== undefined) {
            payload.email = String(data.email).trim().toLowerCase();
        }
        if (data.nombre !== undefined) {
            payload.nombre = String(data.nombre).trim() || null;
        }
        if (data.telefono !== undefined) {
            payload.telefono = data.telefono ? String(data.telefono).trim() : null;
        }
        if (data.pin !== undefined) {
            payload.pin = data.pin ? String(data.pin).trim() : null;
        }
        if (data.password !== undefined) {
            const password = data.password ? String(data.password) : null;
            if (password && password.length > 0) {
                payload.password_hash = await bcrypt.hash(password, 10);
            }
        }
        if (!esUpdate && !payload.password_hash) {
            payload.password_hash = await bcrypt.hash('demo123', 10);
        }
        if (data.rol !== undefined) {
            const rol = String(data.rol).trim().toLowerCase();
            if (!ROLES_VALIDOS.includes(rol)) {
                throw new common_1.BadRequestException(`Rol inválido: ${data.rol}`);
            }
            payload.rol = rol;
        }
        if (data.zona_id !== undefined) {
            payload.zona_id = data.zona_id || null;
            if (payload.zona_id) {
                const zona = await this.prisma.zona.findFirst({
                    where: { id: payload.zona_id, tenant_id: tenantId },
                });
                if (!zona)
                    throw new common_1.BadRequestException('Zona no encontrada para este tenant');
            }
        }
        if (data.permisos !== undefined) {
            const permisos = Array.isArray(data.permisos)
                ? data.permisos.filter((p) => typeof p === 'string' && p.length > 0)
                : [];
            payload.permisos = permisos.length > 0 ? permisos : null;
        }
        if (data.activo !== undefined) {
            payload.activo = Boolean(data.activo);
        }
        if (payload.rol && data.permisos === undefined && !esUpdate) {
            payload.permisos = this.permisosPorRol(payload.rol);
        }
        return payload;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map