import { IsOptional, IsString } from 'class-validator';

export class CargarExcelDto {
  @IsOptional()
  @IsString()
  estado_id?: string;

  @IsOptional()
  @IsString()
  municipio_id?: string;
}
