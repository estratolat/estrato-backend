import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateCampanaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  script?: string;

  @IsString()
  @IsOptional()
  voz_id_elevenlabs?: string;

  @IsString()
  @IsOptional()
  assistant_id?: string;

  @IsString()
  @IsOptional()
  phone_number_id?: string;

  @IsEnum(['borrador', 'activa', 'pausada', 'finalizada'])
  @IsOptional()
  status?: string;
}
