import { IsString, IsNumberString, IsOptional } from 'class-validator';

export class ImportarSeccionesIneDto {
  @IsString()
  nombre: string;

  @IsString()
  color: string;

  @IsNumberString()
  estado_id: string;

  @IsString()
  estado: string;

  @IsOptional()
  @IsNumberString()
  municipio_id?: string;

  @IsOptional()
  @IsString()
  municipio?: string;

  @IsOptional()
  @IsString()
  anio?: string;

  @IsOptional()
  @IsString()
  shapefile_hint?: string;
}
