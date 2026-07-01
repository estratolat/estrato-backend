import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre_candidato: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cargo_busca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  slogan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200000)
  foto_url?: string;

  @IsEmail()
  owner_email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  owner_nombre: string;

  @IsString()
  @MinLength(6)
  @MaxLength(120)
  owner_password: string;
}
