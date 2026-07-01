import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { PrismaService } from '../common/services/prisma.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('projects')
  @ApiOperation({ summary: 'Listar todos los proyectos (superadmin)' })
  async listProjects() {
    return this.adminService.listProjects();
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Obtener detalle de un proyecto (superadmin)' })
  async getProject(@Param('id') id: string) {
    return this.adminService.getProject(id);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Crear nuevo proyecto con owner inicial (superadmin)' })
  async createProject(@Body() data: CreateProjectDto) {
    return this.adminService.createProject(data);
  }

  @Post('limpiar-capas-externas')
  @ApiOperation({ summary: 'Eliminar capas de fuentes externas (INEGI/Nominatim/SEPOMEX) de la base de datos' })
  async limpiarCapasExternas() {
    return this.adminService.limpiarCapasExternas();
  }

  // Endpoint temporal ya ejecutado; se deja comentado para referencia.
  // @Post('migrate-bloqueada-capa')
  // @ApiOperation({ summary: 'TEMPORAL: agrega columna bloqueada a mapas_capas' })
  // async migrateBloqueadaCapa() {
  //   await this.prisma.$executeRawUnsafe(`
  //     ALTER TABLE "mapas_capas"
  //     ADD COLUMN IF NOT EXISTS "bloqueada" BOOLEAN NOT NULL DEFAULT false;
  //   `);
  //   return { ok: true, mensaje: 'Columna bloqueada agregada a mapas_capas' };
  // }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Actualizar datos de un proyecto (superadmin)' })
  async updateProject(@Param('id') id: string, @Body() data: UpdateProjectDto) {
    return this.adminService.updateProject(id, data);
  }
}
