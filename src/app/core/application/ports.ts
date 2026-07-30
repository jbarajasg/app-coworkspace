import {
  Reservation,
  ReservationDraft,
  ReservationStatus,
} from '../domain/models/reservation.model';
import { Space } from '../domain/models/space.model';

/**
 * Puertos (Clean Architecture): contratos que la capa de aplicación exige.
 * Son clases abstractas y no interfaces porque las interfaces de TS
 * se borran en runtime y no pueden actuar como token de DI de Angular.
 */
export abstract class SpaceRepository {
  abstract findAll(): Promise<readonly Space[]>;
}

export abstract class ReservationRepository {
  abstract findAll(): Promise<readonly Reservation[]>;
  abstract create(draft: ReservationDraft): Promise<Reservation>;
  abstract updateStatus(id: number, status: ReservationStatus): Promise<Reservation>;
}
