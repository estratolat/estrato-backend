import { IsArray, IsUUID } from 'class-validator';

export class ImportarVotantesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  votante_ids: string[];
}
