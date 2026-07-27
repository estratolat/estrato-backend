import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsJSON,
} from 'class-validator';

export type CanalCrmCanal =
  | 'whatsapp'
  | 'messenger'
  | 'instagram'
  | 'sms'
  | 'email';

export type CanalCrmProveedor =
  | 'meta'
  | 'twilio'
  | 'vonage'
  | 'smtp'
  | 'custom';

export class CreateCanalCrmDto {
  @IsEnum(['whatsapp', 'messenger', 'instagram', 'sms', 'email'])
  canal: CanalCrmCanal;

  @IsString()
  nombre: string;

  @IsEnum(['meta', 'twilio', 'vonage', 'smtp', 'custom'])
  @IsOptional()
  proveedor?: CanalCrmProveedor = 'meta';

  @IsString()
  @IsOptional()
  cuenta_id?: string;

  @IsString()
  @IsOptional()
  access_token?: string;

  @IsString()
  @IsOptional()
  desde_numero?: string;

  @IsString()
  @IsOptional()
  webhook_path?: string;

  @IsString()
  @IsOptional()
  verify_token?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean = true;

  @IsOptional()
  metadata?: any;
}

export class UpdateCanalCrmDto {
  @IsEnum(['whatsapp', 'messenger', 'instagram', 'sms', 'email'])
  @IsOptional()
  canal?: CanalCrmCanal;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsEnum(['meta', 'twilio', 'vonage', 'smtp', 'custom'])
  @IsOptional()
  proveedor?: CanalCrmProveedor;

  @IsString()
  @IsOptional()
  cuenta_id?: string;

  @IsString()
  @IsOptional()
  access_token?: string;

  @IsString()
  @IsOptional()
  desde_numero?: string;

  @IsString()
  @IsOptional()
  webhook_path?: string;

  @IsString()
  @IsOptional()
  verify_token?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsOptional()
  metadata?: any;
}

export class CanalCrmIdDto {
  @IsUUID()
  id: string;
}
