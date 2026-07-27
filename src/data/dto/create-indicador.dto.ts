import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class CreateIndicadorDto {
  @IsString()
  categoria: string;

  @IsOptional()
  @IsString()
  subcategoria?: string;

  @IsString()
  indicador: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  valor_numerico?: number;

  @IsOptional()
  @IsString()
  valor_texto?: string;

  @IsOptional()
  @IsString()
  unidad?: string;

  @IsOptional()
  @IsString()
  periodo?: string;

  @IsOptional()
  @IsString()
  fuente?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL de la fuente debe ser válida' })
  fuente_url?: string;

  @IsOptional()
  @IsNumber()
  coordenada_x?: number;

  @IsOptional()
  @IsNumber()
  coordenada_y?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsNumber()
  orden?: number;
}
