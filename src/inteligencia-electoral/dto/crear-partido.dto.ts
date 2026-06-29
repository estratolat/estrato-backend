import { IsHexColor, IsInt, IsOptional, IsString, IsUrl, Length, MaxLength, Min } from 'class-validator';

export class CrearPartidoDto {
  @IsString()
  @MaxLength(120)
  nombre: string;

  @IsString()
  @Length(1, 20)
  siglas: string;

  @IsOptional()
  @IsHexColor()
  color_hex?: string;

  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

export class ActualizarPartidoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  siglas?: string;

  @IsOptional()
  @IsHexColor()
  color_hex?: string;

  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
