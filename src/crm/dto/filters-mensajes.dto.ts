import { IsOptional, IsUUID, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltersMensajesDto {
  @IsUUID()
  @IsOptional()
  votante_id?: string;

  @IsEnum(['whatsapp', 'messenger', 'instagram', 'form', 'sms', 'email'])
  @IsOptional()
  canal?: 'whatsapp' | 'messenger' | 'instagram' | 'form' | 'sms' | 'email';

  @IsEnum(['inbound', 'outbound'])
  @IsOptional()
  direccion?: 'inbound' | 'outbound';

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}
