import { IsOptional, IsString } from 'class-validator';

export class ImportarSeccionesExcelDto {
  @IsOptional()
  @IsString()
  estado_id?: string;

  @IsOptional()
  @IsString()
  estado?: string;
}
