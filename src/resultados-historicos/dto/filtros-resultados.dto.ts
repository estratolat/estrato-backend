import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { TipoHistorico, TipoEleccion } from './importar-resultados.dto';

export class FiltrosResultadosDto {
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  anio?: number;

  @IsOptional()
  @IsEnum(TipoHistorico)
  tipo_historico?: TipoHistorico;

  @IsOptional()
  @IsEnum(TipoEleccion)
  tipo_eleccion?: TipoEleccion;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  estado_id?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  municipio_id?: number;

  @IsOptional()
  @IsString()
  seccion?: string;

  @IsOptional()
  @IsString()
  casilla?: string;
}
