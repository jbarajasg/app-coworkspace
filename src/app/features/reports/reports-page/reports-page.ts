import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReservationsStore } from '../../../core/application/reservations.store';
import { SpacesStore } from '../../../core/application/spaces.store';
import { computeOccupancyReport } from '../../../core/domain/rules/occupancy-report';

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {
  protected readonly spacesStore = inject(SpacesStore);
  protected readonly reservationsStore = inject(ReservationsStore);

  protected readonly from = signal(daysFromToday(-7));
  protected readonly to = signal(daysFromToday(7));

  protected readonly invalidRange = computed(() => this.to() < this.from());
  protected readonly loading = computed(
    () => this.spacesStore.loading() || this.reservationsStore.loading(),
  );
  protected readonly error = computed(
    () => this.spacesStore.error() ?? this.reservationsStore.error(),
  );

  protected readonly report = computed(() =>
    computeOccupancyReport(
      this.spacesStore.spaces(),
      this.reservationsStore.reservations(),
      this.from(),
      this.to(),
    ),
  );

  constructor() {
    this.spacesStore.load();
    this.reservationsStore.load();
  }

  protected setFrom(event: Event): void {
    this.from.set((event.target as HTMLInputElement).value);
  }

  protected setTo(event: Event): void {
    this.to.set((event.target as HTMLInputElement).value);
  }

  protected hours(minutes: number): string {
    return `${(minutes / 60).toLocaleString('es', { maximumFractionDigits: 1 })} h`;
  }
}
