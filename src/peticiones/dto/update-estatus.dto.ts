import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstatusPeticion } from '@prisma/client';

export class UpdateEstatusDto {
  @ApiProperty({ enum: EstatusPeticion, description: 'Nuevo estatus de la petición' })
  @IsEnum(EstatusPeticion)
  estatus: EstatusPeticion;

  @ApiPropertyOptional({ description: 'Comentario del cambio de estatus' })
  @IsString()
  @IsOptional()
  comentario?: string;
}
