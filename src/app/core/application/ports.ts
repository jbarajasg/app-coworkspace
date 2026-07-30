import {
  Reservation,
  ReservationDraft,
  ReservationStatus,
} from '../domain/models/reservation.model';
import { Space } from '../domain/models/space.model';

export abstract class SpaceRepository {
  abstract findAll(): Promise<readonly Space[]>;
}

export abstract class ReservationRepository {
  abstract findAll(): Promise<readonly Reservation[]>;
  abstract create(draft: ReservationDraft): Promise<Reservation>;
  abstract updateStatus(id: number, status: ReservationStatus): Promise<Reservation>;
}
