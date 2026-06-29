import { IsString, IsOptional, IsNumberString, IsIn } from 'class-validator';

export class BuscarGlobalDto {
  @IsString()
  q: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;

  @IsIn(['todos', 'capa', 'capa_feature'])
  @IsOptional()
  tipo?: string;
}
