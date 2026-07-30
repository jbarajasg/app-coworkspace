export const RESERVATION_PURPOSES = [
  'Reunión',
  'Trabajo individual',
  'Capacitación',
  'Evento',
] as const;
export type ReservationPurpose = (typeof RESERVATION_PURPOSES)[number];

export const RESERVATION_STATUSES = [
  'Confirmada',
  'Completada',
  'Cancelada',
  'Cancelada con penalización',
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** `date` en formato ISO `yyyy-MM-dd`; horas en formato 24h `HH:mm`. */
export interface Reservation {
  readonly id: number;
  readonly spaceId: number;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly requester: string;
  readonly attendees: number;
  readonly purpose: ReservationPurpose;
  readonly status: ReservationStatus;
}

/** Solicitud de reserva: aún sin id ni estado (los asigna el sistema). */
export type ReservationDraft = Omit<Reservation, 'id' | 'status'>;
