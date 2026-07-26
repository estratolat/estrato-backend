import { IsOptional, IsString, IsUrl, IsArray, ValidateNested } from 'class-validator';

export class RedSocialDto {
  @IsString()
  red: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL de la red social debe ser válida' })
  url?: string;
}

export class UpdatePerfilDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  nombre_publico?: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsOptional()
  @IsString()
  foto_url?: string;

  @IsOptional()
  @IsArray()
  redes_sociales?: RedSocialDto[];

  @IsOptional()
  @IsString()
  biografia?: string;

  @IsOptional()
  @IsString()
  gustos?: string;

  @IsOptional()
  @IsString()
  discurso?: string;

  @IsOptional()
  @IsString()
  video_url?: string;

  @IsOptional()
  @IsString()
  video_transcripcion?: string;
}
