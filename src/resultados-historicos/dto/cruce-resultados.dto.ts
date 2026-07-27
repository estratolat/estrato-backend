import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { TipoHistorico, TipoEleccion } from './importar-resultados.dto';

export class CruceResultadosDto {
  @IsEnum(TipoEleccion)
  tipo_eleccion!: TipoEleccion;

  @IsOptional()
  @IsEnum(TipoHistorico)
  tipo_historico?: TipoHistorico = TipoHistorico.principal;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map((v) => Number(v));
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '')
        .map((v) => Number(v));
    }
    return [Number(value)];
  })
  anios?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map((v) => String(v).toUpperCase().trim());
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim().toUpperCase())
        .filter((v) => v !== '');
    }
    return [String(value).toUpperCase().trim()];
  })
  partidos_bloque?: string[];
}
