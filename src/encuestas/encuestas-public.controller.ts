import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EncuestasService } from './encuestas.service';

@ApiTags('Encuestas Públicas')
@Controller('encuestas/publica')
export class EncuestasPublicController {
  constructor(private readonly encuestasService: EncuestasService) {}

  @Get(':slug/:id')
  @ApiOperation({ summary: 'Obtener encuesta activa pública por slug de proyecto' })
  findPublic(@Param('slug') slug: string, @Param('id') id: string) {
    return this.encuestasService.findPublic(slug, id);
  }

  @Post(':slug/:id/respuestas')
  @ApiOperation({ summary: 'Enviar respuesta pública con correo (anti-duplicado)' })
  createRespuestaPublica(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.encuestasService.createRespuestaPublica(slug, id, data);
  }
}
