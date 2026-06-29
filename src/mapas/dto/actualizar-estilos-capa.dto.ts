import { IsObject, IsOptional } from 'class-validator';

export class ActualizarEstilosCapaDto {
  @IsObject()
  @IsOptional()
  estilos: Record<string, { color?: string; nombre?: string }>;
}
