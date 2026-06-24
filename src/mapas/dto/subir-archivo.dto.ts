import { IsString, IsOptional, IsIn, IsBoolean, IsObject } from 'class-validator';

export class SubirArchivoMapaDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsIn(['kml', 'geojson', 'shapefile', 'gpx'])
  tipo_archivo: 'kml' | 'geojson' | 'shapefile' | 'gpx';

  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
