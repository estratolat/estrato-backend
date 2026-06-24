import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CandidatoService } from './candidato.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { AnalizarDto } from './dto/analizar.dto';
import { GenerarContenidoDto } from './dto/generar-contenido.dto';

@ApiTags('Candidato')
@Controller('candidato')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CandidatoController {
  constructor(private readonly candidatoService: CandidatoService) {}

  @Get('perfil')
  @ApiOperation({ summary: 'Obtener perfil del candidato del tenant' })
  getPerfil(@Req() req) {
    return this.candidatoService.getPerfil(req.tenant.id);
  }

  @Post('perfil')
  @Roles('owner', 'candidato', 'cm')
  @ApiOperation({ summary: 'Crear o actualizar perfil del candidato' })
  upsertPerfil(@Body() data: UpdatePerfilDto, @Req() req) {
    return this.candidatoService.upsertPerfil(req.tenant.id, data);
  }

  @Post('perfil/analizar')
  @Roles('owner', 'candidato', 'cm')
  @ApiOperation({ summary: 'Analizar discurso y transcripción con Anthropic' })
  async analizar(@Body() body: AnalizarDto, @Req() req) {
    return this.candidatoService.analizar(req.tenant.id, body.transcribir_video);
  }

  @Post('generar')
  @Roles('owner', 'candidato', 'cm')
  @ApiOperation({ summary: 'Generar boletín o caption con la voz del candidato' })
  generar(@Body() data: GenerarContenidoDto, @Req() req) {
    return this.candidatoService.generarContenido(req.tenant.id, data.tipo, {
      tema: data.tema,
      que: data.que,
      quien: data.quien,
      como: data.como,
      cuando: data.cuando,
      donde: data.donde,
      por_que: data.por_que,
      para_que: data.para_que,
    });
  }
}
