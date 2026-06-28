import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}
