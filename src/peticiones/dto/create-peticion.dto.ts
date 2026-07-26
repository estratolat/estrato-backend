import { IsString, IsOptional, IsEnum, IsUUID, IsObject, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoPeticion, OrigenPeticion, CategoriaPeticion, PrioridadPeticion, EstatusPeticion } from '@prisma/client';

export class CreatePeticionDto {
  @ApiProperty({ description: 'Título de la petición' })
  @IsString()
  @IsOptional()
  titulo?: string;

  @ApiProperty({ description: 'Descripción detallada de la petición' })
  @IsString()
  descripcion: string;

  @ApiPropertyOptional({ description: 'ID del votante relacionado (opcional)' })
  @IsUUID()
  @IsOptional()
  votante_id?: string;

  @ApiPropertyOptional({ description: 'ID del usuario responsable de atender la petición' })
  @IsUUID()
  @IsOptional()
  responsable_id?: string;

  @ApiProperty({ enum: TipoPeticion, description: 'Tipo de petición' })
  @IsEnum(TipoPeticion)
  @IsOptional()
  tipo?: TipoPeticion;

  @ApiProperty({ enum: OrigenPeticion, description: 'Origen de la petición' })
  @IsEnum(OrigenPeticion)
  @IsOptional()
  origen?: OrigenPeticion;

  @ApiProperty({ enum: CategoriaPeticion, description: 'Categoría de la petición' })
  @IsEnum(CategoriaPeticion)
  @IsOptional()
  categoria?: CategoriaPeticion;

  @ApiProperty({ enum: PrioridadPeticion, description: 'Prioridad de la petición' })
  @IsEnum(PrioridadPeticion)
  @IsOptional()
  prioridad?: PrioridadPeticion;

  @ApiProperty({ enum: EstatusPeticion, description: 'Estatus inicial de la petición' })
  @IsEnum(EstatusPeticion)
  @IsOptional()
  estatus?: EstatusPeticion;

  @ApiPropertyOptional({ description: 'Sección electoral asociada' })
  @IsString()
  @IsOptional()
  seccion_electoral?: string;

  @ApiPropertyOptional({ description: 'Coordenadas {lat, lng}' })
  @IsObject()
  @IsOptional()
  coordenadas?: { lat: number; lng: number };

  @ApiPropertyOptional({ description: 'Dirección o referencia escrita de la ubicación' })
  @IsString()
  @IsOptional()
  ubicacion_texto?: string;

  @ApiPropertyOptional({ description: 'Fecha compromiso de resolución (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  fecha_compromiso?: string;

  @ApiPropertyOptional({ description: 'Indica si la petición requiere evidencia fotográfica para cerrarse' })
  @IsBoolean()
  @IsOptional()
  requiere_evidencia?: boolean;
}
