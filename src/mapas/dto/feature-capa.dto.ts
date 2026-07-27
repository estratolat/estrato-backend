export class UpdateFeatureCapaDto {
  nombre?: string;
  color?: string;
  opacidad?: number;
  bloqueado?: boolean;
  metadata?: Record<string, any>;
}

export interface FeatureCapaResponse {
  feature_id: string;
  nombre: string;
  color: string;
  opacidad: number;
  bloqueado: boolean;
  metadata: Record<string, any>;
  properties: Record<string, any>;
  geometry?: any;
  bbox?: [number, number, number, number];
}
