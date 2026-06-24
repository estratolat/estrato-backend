import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateMensajeDto {
  @IsUUID()
  votante_id: string;

  @IsEnum(['whatsapp', 'messenger', 'instagram', 'form', 'sms', 'email'])
  canal: 'whatsapp' | 'messenger' | 'instagram' | 'form' | 'sms' | 'email';

  @IsString()
  contenido: string;

  @IsString()
  @IsOptional()
  template_usado?: string;
}
