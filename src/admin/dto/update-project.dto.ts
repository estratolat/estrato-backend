import {
  IsString,
  IsOptional,
  IsIn,
  IsUrl,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre_candidato?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cargo_busca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  slogan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  dominio_personalizado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200000)
  foto_url?: string;

  @IsOptional()
  @IsIn(['basico', 'pro', 'enterprise'])
  plan?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
