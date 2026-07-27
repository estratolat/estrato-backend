import { IsOptional, IsString } from 'class-validator';

export class CruceIndicadoresDto {
  @IsString()
  indicadorA: string;

  @IsString()
  indicadorB: string;

  @IsOptional()
  @IsString()
  periodo?: string;
}
