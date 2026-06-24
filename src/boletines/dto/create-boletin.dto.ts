import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class CreateBoletinDto {
  @IsString()
  prompt_usuario: string;

  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  bajada?: string;

  @IsString()
  @IsOptional()
  desarrollo?: string;

  @IsString()
  @IsOptional()
  copy_generado?: string;

  @IsString()
  @IsOptional()
  caption_redes?: string;

  @IsString()
  @IsOptional()
  imagen_url?: string;

  @IsBoolean()
  @IsOptional()
  aprobado?: boolean;
}
