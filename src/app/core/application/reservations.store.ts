import { Injectable, inject, signal } from '@angular/core';
import { Reservation, ReservationDraft } from '../domain/models/reservation.model';
import { Space } from '../domain/models/space.model';
import { resolveCancellationStatus } from '../domain/rules/cancellation';
import { validateReservation } from '../domain/rules/reservation-rules';
import { VALID, ValidationResult, invalid } from '../domain/rules/validation';
import { ReservationRepository } from './ports';

@Injectable({ providedIn: 'root' })
export class ReservationsStore {
  private readonly repository = inject(ReservationRepository);

  private readonly _reservations = signal<readonly Reservation[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly reservations = this._reservations.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._reservations.set(await this.repository.findAll());
    } catch {
      this._error.set('No se pudieron cargar las reservas. Intenta de nuevo.');
    } finally {
      this._loading.set(false);
    }
  }

  async create(draft: ReservationDraft, space: Space): Promise<ValidationResult> {
    const result = validateReservation(draft, space, this._reservations());
    if (!result.valid) return result;

    try {
      const created = await this.repository.create(draft);
      this._reservations.update((all) => [...all, created]);
      return VALID;
    } catch {
      return invalid([
        { code: 'PERSISTENCE', message: 'No se pudo guardar la reserva. Intenta de nuevo.' },
      ]);
    }
  }

  async cancel(id: number, now: Date = new Date()): Promise<void> {
    const reservation = this._reservations().find((r) => r.id === id);
    if (!reservation || reservation.status !== 'Confirmada') return;

    const status = resolveCancellationStatus(reservation, now);
    await this.persistStatus(id, status);
  }

  async complete(id: number): Promise<void> {
    const reservation = this._reservations().find((r) => r.id === id);
    if (!reservation || reservation.status !== 'Confirmada') return;

    await this.persistStatus(id, 'Completada');
  }

  private async persistStatus(id: number, status: Reservation['status']): Promise<void> {
    this._error.set(null);
    try {
      const updated = await this.repository.updateStatus(id, status);
      this._reservations.update((all) => all.map((r) => (r.id === id ? updated : r)));
    } catch {
      this._error.set('No se pudo actualizar la reserva. Intenta de nuevo.');
    }
  }
}
