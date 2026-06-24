import { IsEnum, IsString, IsOptional } from 'class-validator';

export class GenerarBoletinDto {
  @IsEnum(['boletin', 'redes'])
  tipo: 'boletin' | 'redes';

  @IsString()
  @IsOptional()
  tema?: string;

  @IsString()
  @IsOptional()
  que?: string;

  @IsString()
  @IsOptional()
  quien?: string;

  @IsString()
  @IsOptional()
  como?: string;

  @IsString()
  @IsOptional()
  cuando?: string;

  @IsString()
  @IsOptional()
  donde?: string;

  @IsString()
  @IsOptional()
  por_que?: string;

  @IsString()
  @IsOptional()
  para_que?: string;
}
