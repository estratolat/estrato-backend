import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, IsEnum, IsObject, ValidateNested } from 'class-validator';

export enum TipoHistorico {
  principal = 'principal',
  complementario = 'complementario',
}

export enum TipoEleccion {
  ayuntamiento = 'ayuntamiento',
  diputado_local = 'diputado_local',
  diputado_federal = 'diputado_federal',
  senador = 'senador',
  gobernador = 'gobernador',
  presidente_republica = 'presidente_republica',
}

export class MapeoColumnasDto {
  @IsOptional()
  @IsString()
  seccion?: string;

  @IsOptional()
  @IsString()
  casilla?: string;

  @IsOptional()
  @IsString()
  tipo_casilla?: string;

  @IsOptional()
  @IsString()
  ext_contigua?: string;

  @IsOptional()
  @IsString()
  lista_nominal?: string;

  @IsOptional()
  @IsString()
  votos_nulos?: string;

  @IsOptional()
  @IsString()
  votos_no_reg?: string;

  @IsOptional()
  @IsString()
  votos_validos?: string;

  @IsOptional()
  @IsString()
  total_votos?: string;

  @IsOptional()
  @IsString()
  participacion_pct?: string;

  @IsOptional()
  @IsString()
  filtro_municipio?: string;

  @IsOptional()
  @IsString()
  filtro_municipio_columna?: string;
}

export class ActorMapeoDto {
  @IsString()
  nombre!: string;

  @IsString()
  columna!: string;

  @IsEnum(['individual', 'coalicion'])
  tipo!: 'individual' | 'coalicion';
}

export class PreviewResultadosDto {
  @IsEnum(TipoHistorico)
  tipo_historico!: TipoHistorico;

  @IsEnum(TipoEleccion)
  tipo_eleccion!: TipoEleccion;

  @IsInt()
  @Transform(({ value }) => Number(value))
  anio!: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  estado_id?: number;

  @IsOptional()
  @IsString()
  estado_nombre?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  municipio_id?: number;

  @IsOptional()
  @IsString()
  municipio_nombre?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  distrito_local_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  distrito_federal_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  saltar_lineas?: number;

  // Mapeo y actores se reciben como JSON strings y se validan de forma laxa en preview/importar
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return undefined;
      try {
        return JSON.parse(trimmed);
      } catch {
        return undefined;
      }
    }
    return value;
  })
  mapeo?: any;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return [];
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  actores?: any[];

  @IsOptional()
  @IsString()
  partido_principal?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  reemplazar?: boolean;

  // Permitir campos adicionales en preview/importar sin que el ValidationPipe
  // global (forbidNonWhitelisted) los rechace como "property should not exist".
  [key: string]: any;
}

export class ImportarResultadosDto {
  @IsEnum(TipoHistorico)
  tipo_historico!: TipoHistorico;

  @IsEnum(TipoEleccion)
  tipo_eleccion!: TipoEleccion;

  @IsInt()
  @Transform(({ value }) => Number(value))
  anio!: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  estado_id?: number;

  @IsOptional()
  @IsString()
  estado_nombre?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  municipio_id?: number;

  @IsOptional()
  @IsString()
  municipio_nombre?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  distrito_local_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  distrito_federal_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  saltar_lineas?: number;

  @IsOptional()
  @ValidateNested({ message: 'mapeo debe ser un objeto válido' })
  @Type(() => MapeoColumnasDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return undefined;
      try {
        return JSON.parse(trimmed);
      } catch {
        return undefined;
      }
    }
    return value;
  })
  mapeo?: MapeoColumnasDto;

  @IsOptional()
  @IsArray({ message: 'actores debe ser un array' })
  @ValidateNested({ each: true, message: 'cada actor debe tener nombre, columna y tipo válidos' })
  @Type(() => ActorMapeoDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return [];
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (Array.isArray(value)) return value;
    return [];
  })
  actores?: ActorMapeoDto[];

  @IsOptional()
  @IsString()
  partido_principal?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  reemplazar?: boolean;
}
