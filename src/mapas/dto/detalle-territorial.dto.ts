import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class DetalleTerritorialDto {
  @IsString()
  tipo: string;

  @IsString()
  id: string;

  @IsString()
  nombre: string;

  @IsObject()
  geometry: any;

  @IsNumber()
  @IsOptional()
  estado_id?: number;

  @IsNumber()
  @IsOptional()
  municipio_id?: number;

  @IsString()
  @IsOptional()
  seccion?: string;

  @IsString()
  @IsOptional()
  clave?: string;
}
