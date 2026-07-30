import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReservationsStore } from '../../../core/application/reservations.store';
import { SpacesStore } from '../../../core/application/spaces.store';
import {
  RESERVATION_STATUSES,
  Reservation,
  ReservationStatus,
} from '../../../core/domain/models/reservation.model';
import { resolveCancellationStatus } from '../../../core/domain/rules/cancellation';
import { StatusBadge } from '../../../shared/ui/status-badge';

@Component({
  selector: 'app-reservations-page',
  imports: [RouterLink, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservations-page.html',
})
export class ReservationsPage {
  protected readonly store = inject(ReservationsStore);
  protected readonly spacesStore = inject(SpacesStore);

  protected readonly statuses = RESERVATION_STATUSES;

  // --- Filtros (RF-04) ---
  protected readonly filterDate = signal('');
  protected readonly filterSpaceId = signal(0);
  protected readonly filterStatus = signal<'' | ReservationStatus>('');

  protected readonly filtered = computed(() => {
    const date = this.filterDate();
    const spaceId = this.filterSpaceId();
    const status = this.filterStatus();
    return this.store
      .reservations()
      .filter(
        (r) =>
          (!date || r.date === date) &&
          (!spaceId || r.spaceId === spaceId) &&
          (!status || r.status === status),
      )
      .toSorted((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  });

  protected readonly hasActiveFilters = computed(
    () => !!this.filterDate() || this.filterSpaceId() !== 0 || !!this.filterStatus(),
  );

  // --- Cancelación con confirmación (RN-04) ---
  protected readonly pendingCancel = signal<Reservation | null>(null);
  protected readonly penaltyApplies = computed(() => {
    const reservation = this.pendingCancel();
    return reservation
      ? resolveCancellationStatus(reservation, new Date()) === 'Cancelada con penalización'
      : false;
  });
  protected readonly busyId = signal<number | null>(null);

  constructor() {
    void this.store.load();
    void this.spacesStore.load();
  }

  protected spaceName(id: number): string {
    return this.spacesStore.spaceById(id)?.name ?? `Espacio ${id}`;
  }

  protected formatDate(isoDate: string): string {
    return new Intl.DateTimeFormat('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${isoDate}T00:00:00`));
  }

  protected setDate(event: Event): void {
    this.filterDate.set((event.target as HTMLInputElement).value);
  }

  protected setSpace(event: Event): void {
    this.filterSpaceId.set(Number((event.target as HTMLSelectElement).value));
  }

  protected setStatus(event: Event): void {
    this.filterStatus.set((event.target as HTMLSelectElement).value as '' | ReservationStatus);
  }

  protected clearFilters(): void {
    this.filterDate.set('');
    this.filterSpaceId.set(0);
    this.filterStatus.set('');
  }

  protected async confirmCancel(): Promise<void> {
    const reservation = this.pendingCancel();
    if (!reservation) return;
    this.busyId.set(reservation.id);
    try {
      await this.store.cancel(reservation.id);
    } finally {
      this.busyId.set(null);
      this.pendingCancel.set(null);
    }
  }

  protected async complete(id: number): Promise<void> {
    this.busyId.set(id);
    try {
      await this.store.complete(id);
    } finally {
      this.busyId.set(null);
    }
  }
}
