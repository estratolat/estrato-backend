export declare class GisParserService {
    detectarTipo(nombre: string): string;
    parse(archivo: Express.Multer.File, tipoArchivo?: string, shapefileHint?: string): Promise<any>;
    private parseKml;
    private parseGeoJson;
    private parseShapefile;
    private extraerShapefileDeZipAPath;
    private parseGpx;
    private normalizarGeoJSON;
    private limpiarFeatures;
    private limpiarFeature;
    private proyeccionDesdePrj;
    private reproyectarGeometria;
    private reproyectarNodo;
}
