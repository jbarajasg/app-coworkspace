import { Reservation, ReservationStatus } from '../models/reservation.model';
import { toStartDate } from './time';

export const PENALTY_WINDOW_HOURS = 24;

type CancellationStatus = Extract<ReservationStatus, 'Cancelada' | 'Cancelada con penalización'>;

/**
 * RN-04: cancelar con más de 24h de anticipación no penaliza;
 * con 24h o menos, se marca "Cancelada con penalización".
 * `now` se inyecta como parámetro para que la regla sea determinista y testeable.
 */
export function resolveCancellationStatus(
  reservation: Pick<Reservation, 'date' | 'startTime'>,
  now: Date,
): CancellationStatus {
  const start = toStartDate(reservation.date, reservation.startTime);
  const hoursUntilStart = (start.getTime() - now.getTime()) / 3_600_000;
  return hoursUntilStart > PENALTY_WINDOW_HOURS ? 'Cancelada' : 'Cancelada con penalización';
}
