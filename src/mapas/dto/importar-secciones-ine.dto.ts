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

  @IsNumberString()
  municipio_id: string;

  @IsString()
  municipio: string;

  @IsOptional()
  @IsString()
  anio?: string;
}
