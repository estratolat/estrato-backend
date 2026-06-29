import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class ConsultaIADto {
  @IsString()
  pregunta: string;

  @IsOptional()
  @IsObject()
  contextoCampana?: Record<string, any>;

  @IsOptional()
  @IsObject()
  fuentes?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  filtroTerritorial?: { tipo: string; valor: string };

  @IsOptional()
  @IsString()
  @IsUUID()
  eleccionId?: string;
}
