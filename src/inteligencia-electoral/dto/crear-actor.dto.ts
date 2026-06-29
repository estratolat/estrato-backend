import { IsBoolean, IsHexColor, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, MaxLength, Min } from 'class-validator';

export class CrearActorDto {
  @IsOptional()
  @IsUUID()
  partido_id?: string;

  @IsOptional()
  @IsBoolean()
  es_coalicion?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre_coalicion?: string;

  @IsString()
  @MaxLength(200)
  nombre_visual: string;

  @IsOptional()
  @IsHexColor()
  color_hex?: string;

  @IsString()
  @Length(1, 100)
  columna_excel_alias: string;

  @IsOptional()
  @IsIn(['TOTAL', 'DIFERENCIADO'])
  tipo_voto?: 'TOTAL' | 'DIFERENCIADO' = 'TOTAL';

  @IsOptional()
  @IsIn(['PARTIDO', 'CANDIDATO', 'COALICION', 'INDEPENDIENTE'])
  tipo_actor?: 'PARTIDO' | 'CANDIDATO' | 'COALICION' | 'INDEPENDIENTE' = 'PARTIDO';

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

export class ActualizarActorDto {
  @IsOptional()
  @IsUUID()
  partido_id?: string;

  @IsOptional()
  @IsBoolean()
  es_coalicion?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre_coalicion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre_visual?: string;

  @IsOptional()
  @IsHexColor()
  color_hex?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  columna_excel_alias?: string;

  @IsOptional()
  @IsIn(['TOTAL', 'DIFERENCIADO'])
  tipo_voto?: 'TOTAL' | 'DIFERENCIADO';

  @IsOptional()
  @IsIn(['PARTIDO', 'CANDIDATO', 'COALICION', 'INDEPENDIENTE'])
  tipo_actor?: 'PARTIDO' | 'CANDIDATO' | 'COALICION' | 'INDEPENDIENTE';

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
