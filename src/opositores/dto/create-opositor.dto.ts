import { IsOptional, IsString, IsInt, IsArray, Min, Max, IsUrl } from 'class-validator';

export class RedSocialDto {
  @IsString()
  red: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL de la red social debe ser válida' })
  url?: string;
}

export class CreateOpositorDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  partido?: string;

  @IsOptional()
  @IsString()
  foto_url?: string;

  @IsInt()
  @Min(1)
  @Max(3)
  nivel_rivalidad: number;

  @IsOptional()
  @IsArray()
  redes_sociales?: RedSocialDto[];

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  ficha_negativa?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
