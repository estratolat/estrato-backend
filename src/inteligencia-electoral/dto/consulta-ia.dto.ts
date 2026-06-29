import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class ConsultaIADto {
  @IsString()
  pregunta: string;

  @IsOptional()
  @IsObject()
  contextoCampana?: Record<string, any>;

  @IsOptional()
  @IsString()
  @IsUUID()
  eleccionId?: string;
}
