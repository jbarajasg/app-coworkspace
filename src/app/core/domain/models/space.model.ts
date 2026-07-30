export const SPACE_TYPES = [
  'Sala de reuniones',
  'Escritorio compartido',
  'Oficina privada',
  'Sala de conferencias',
] as const;
export type SpaceType = (typeof SPACE_TYPES)[number];

export const SPACE_FEATURES = ['WiFi', 'Proyector', 'Pizarra', 'Videoconferencia'] as const;
export type SpaceFeature = (typeof SPACE_FEATURES)[number];

export const SPACE_STATUSES = ['Disponible', 'Ocupado', 'En mantenimiento'] as const;
export type SpaceStatus = (typeof SPACE_STATUSES)[number];

export interface Space {
  readonly id: number;
  readonly name: string;
  readonly type: SpaceType;
  readonly capacity: number;
  readonly pricePerHour: number;
  readonly features: readonly SpaceFeature[];
  readonly status: SpaceStatus;
}
