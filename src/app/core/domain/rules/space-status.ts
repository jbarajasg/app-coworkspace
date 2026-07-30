import type { Reservation } from '../models/reservation.model';
import type { Space, SpaceStatus } from '../models/space.model';
import { timeToMinutes } from './time';

/**
 * 'Ocupado' es estado derivado, no persistido: un espacio está ocupado
 * si ahora mismo transcurre una reserva Confirmada. 'En mantenimiento'
 * es administrativo y tiene prioridad.
 */
export function resolveSpaceStatus(
  space: Space,
  reservations: readonly Reservation[],
  now: Date,
): SpaceStatus {
  if (space.status === 'En mantenimiento') return 'En mantenimiento';

  const occupiedNow = reservations.some(
    (r) => r.spaceId === space.id && isReservationInProgress(r, now),
  );

  return occupiedNow ? 'Ocupado' : 'Disponible';
}

/** Una reserva está en curso si es hoy, Confirmada, y la hora actual cae dentro de [inicio, fin). */
export function isReservationInProgress(
  reservation: Pick<Reservation, 'date' | 'startTime' | 'endTime' | 'status'>,
  now: Date,
): boolean {
  if (reservation.status !== 'Confirmada') return false;

  const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    reservation.date === isoDate &&
    timeToMinutes(reservation.startTime) <= nowMinutes &&
    nowMinutes < timeToMinutes(reservation.endTime)
  );
}
