import { IsOptional, IsString } from 'class-validator';

export class FiltroIndicadoresDto {
  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  periodo?: string;

  @IsOptional()
  @IsString()
  subcategoria?: string;
}
