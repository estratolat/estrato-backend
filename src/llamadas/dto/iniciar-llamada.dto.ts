import { IsUUID } from 'class-validator';

export class IniciarLlamadaDto {
  @IsUUID()
  votante_id: string;
}
