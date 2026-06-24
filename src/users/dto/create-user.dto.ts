import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ArrayUnique,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  pin?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password?: string;

  @IsEnum(UserRole)
  rol: UserRole;

  @IsOptional()
  @IsUUID()
  zona_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  permisos?: string[];

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
