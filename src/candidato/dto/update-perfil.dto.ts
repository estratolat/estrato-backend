import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdatePerfilDto {
  @IsOptional()
  @IsString()
  nombre?: string;

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
