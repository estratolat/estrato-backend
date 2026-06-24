import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class AnalizarDto {
  @IsOptional()
  @IsBoolean()
  transcribir_video?: boolean;

  @IsOptional()
  @IsString()
  video_url?: string;
}
