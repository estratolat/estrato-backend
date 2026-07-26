import { IsString, IsOptional, IsObject, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEvidenciaDto {
  @ApiProperty({ description: 'URL o data URL base64 de la imagen' })
  @IsString()
  imagen_url: string;

  @ApiPropertyOptional({ description: 'Latitud de captura' })
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @ApiPropertyOptional({ description: 'Longitud de captura' })
  @IsNumber()
  @IsOptional()
  longitud?: number;

  @ApiPropertyOptional({ description: 'Distancia en metros vs ubicación de la petición' })
  @IsNumber()
  @IsOptional()
  distancia_m?: number;

  @ApiPropertyOptional({ description: 'Comentario de la evidencia' })
  @IsString()
  @IsOptional()
  comentario?: string;
}
