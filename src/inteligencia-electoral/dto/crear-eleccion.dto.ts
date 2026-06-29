import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearEleccionDto {
  @IsString()
  @MaxLength(200)
  nombre: string;

  @IsInt()
  @Min(1900)
  anio: number;

  @IsString()
  @MaxLength(100)
  puesto: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}

export class ActualizarEleccionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  anio?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  puesto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
