import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, SECCIONES_DISPONIBLES } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios del tenant' })
  findAll(@Req() req) {
    return this.usersService.findAll(req.tenant.id);
  }

  @Get('permisos/schema')
  @ApiOperation({ summary: 'Schema de secciones y defaults por rol' })
  getPermisosSchema() {
    return {
      secciones: SECCIONES_DISPONIBLES,
      roles: ['owner', 'candidato', 'coord_general', 'coord_zona', 'brigadista', 'cm'],
      defaults: {
        owner: this.usersService.permisosPorRol('owner'),
        candidato: this.usersService.permisosPorRol('candidato'),
        coord_general: this.usersService.permisosPorRol('coord_general'),
        coord_zona: this.usersService.permisosPorRol('coord_zona'),
        brigadista: this.usersService.permisosPorRol('brigadista'),
        cm: this.usersService.permisosPorRol('cm'),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.usersService.findOne(id, req.tenant.id);
  }

  @Post()
  @Roles('owner', 'candidato')
  @ApiOperation({ summary: 'Crear usuario (solo owner/candidato)' })
  create(@Body() data: CreateUserDto, @Req() req) {
    return this.usersService.create(data, req.tenant.id, req.user.userId);
  }

  @Patch(':id')
  @Roles('owner', 'candidato')
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(@Param('id') id: string, @Body() data: UpdateUserDto, @Req() req) {
    // Un usuario no owner/candidato solo puede editarse a sí mismo (aunque el guard ya bloquea esto)
    return this.usersService.update(id, data, req.tenant.id);
  }

  @Delete(':id')
  @Roles('owner', 'candidato')
  @ApiOperation({ summary: 'Desactivar usuario' })
  remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(id, req.tenant.id, req.user.userId);
  }
}
