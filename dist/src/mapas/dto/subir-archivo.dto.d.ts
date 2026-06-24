export declare class SubirArchivoMapaDto {
    nombre: string;
    color?: string;
    tipo_archivo: 'kml' | 'geojson' | 'shapefile' | 'gpx';
    visible?: boolean;
    metadata?: Record<string, any>;
}
