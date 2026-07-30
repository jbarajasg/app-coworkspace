import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReservationsStore } from '../../../core/application/reservations.store';
import { SpacesStore } from '../../../core/application/spaces.store';
import { Reservation } from '../../../core/domain/models/reservation.model';
import {
  BUSINESS_END_MINUTES,
  BUSINESS_START_MINUTES,
  minutesToTime,
  timeToMinutes,
} from '../../../core/domain/rules/time';
import { StatusBadge } from '../../../shared/ui/status-badge';

const SLOT_MINUTES = 30;

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Lunes de la semana de la fecha dada. */
function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

interface CalendarDay {
  readonly iso: string;
  readonly label: string;
  readonly dayNumber: number;
  readonly isToday: boolean;
}

@Component({
  selector: 'app-calendar-page',
  imports: [RouterLink, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-page.html',
})
export class CalendarPage {
  protected readonly spacesStore = inject(SpacesStore);
  protected readonly store = inject(ReservationsStore);
  private readonly router = inject(Router);

  protected readonly slotTimes: readonly string[] = (() => {
    const out: string[] = [];
    for (let m = BUSINESS_START_MINUTES; m < BUSINESS_END_MINUTES; m += SLOT_MINUTES) {
      out.push(minutesToTime(m));
    }
    return out;
  })();

  private readonly today = toIsoDate(new Date());
  protected readonly selectedSpaceId = signal(0);
  protected readonly weekStart = signal(startOfWeek(new Date()));
  protected readonly selectedReservation = signal<Reservation | null>(null);

  protected readonly days = computed<readonly CalendarDay[]>(() => {
    const start = this.weekStart();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const iso = toIsoDate(d);
      return {
        iso,
        label: new Intl.DateTimeFormat('es', { weekday: 'short' }).format(d),
        dayNumber: d.getDate(),
        isToday: iso === this.today,
      };
    });
  });

  protected readonly weekLabel = computed(() => {
    const fmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
    const days = this.days();
    return `${fmt.format(new Date(days[0]!.iso + 'T00:00:00'))} – ${fmt.format(new Date(days[6]!.iso + 'T00:00:00'))}`;
  });

  /** Índice slot→reserva del espacio visible. Solo Confirmada y Completada ocupan. */
  private readonly occupiedSlots = computed(() => {
    const map = new Map<string, Reservation>();
    const spaceId = this.selectedSpaceId();
    if (!spaceId) return map;
    for (const r of this.store.reservations()) {
      if (r.spaceId !== spaceId) continue;
      if (r.status !== 'Confirmada' && r.status !== 'Completada') continue;
      for (let m = timeToMinutes(r.startTime); m < timeToMinutes(r.endTime); m += SLOT_MINUTES) {
        map.set(`${r.date}|${minutesToTime(m)}`, r);
      }
    }
    return map;
  });

  constructor() {
    void this.spacesStore.load();
    void this.store.load();

    effect(() => {
      const spaces = this.spacesStore.spaces();
      if (spaces.length > 0 && this.selectedSpaceId() === 0) {
        this.selectedSpaceId.set(spaces[0]!.id);
      }
    });
  }

  protected slotFor(dayIso: string, time: string): Reservation | undefined {
    return this.occupiedSlots().get(`${dayIso}|${time}`);
  }

  protected isStart(reservation: Reservation, dayIso: string, time: string): boolean {
    return reservation.date === dayIso && reservation.startTime === time;
  }

  protected slotClasses(dayIso: string, time: string): string {
    const reservation = this.slotFor(dayIso, time);
    if (!reservation) {
      return 'bg-white hover:bg-indigo-50';
    }
    const isSelected = this.selectedReservation()?.id === reservation.id;
    const base =
      reservation.status === 'Completada'
        ? 'bg-emerald-400/80 hover:bg-emerald-400'
        : 'bg-indigo-500/90 hover:bg-indigo-500';
    return isSelected ? `${base} ring-2 ring-inset ring-slate-900/40` : base;
  }

  protected slotAriaLabel(dayIso: string, time: string): string {
    const day = new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(`${dayIso}T00:00:00`));
    const reservation = this.slotFor(dayIso, time);
    return reservation
      ? `${day}, ${time}: ocupado por ${reservation.requester} (${reservation.purpose}, ${reservation.status}). Ver detalles.`
      : `${day}, ${time}: libre. Crear reserva.`;
  }

  protected setSpace(event: Event): void {
    this.selectedSpaceId.set(Number((event.target as HTMLSelectElement).value));
    this.selectedReservation.set(null);
  }

  protected shiftWeek(deltaWeeks: number): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + deltaWeeks * 7);
    this.weekStart.set(d);
    this.selectedReservation.set(null);
  }

  protected goToCurrentWeek(): void {
    this.weekStart.set(startOfWeek(new Date()));
    this.selectedReservation.set(null);
  }

  protected onSlotClick(dayIso: string, time: string): void {
    const reservation = this.slotFor(dayIso, time);
    if (reservation) {
      this.selectedReservation.set(reservation);
    } else {
      void this.router.navigate(['/reservas/nueva'], {
        queryParams: { espacio: this.selectedSpaceId(), fecha: dayIso, inicio: time },
      });
    }
  }

  protected spaceName(id: number): string {
    return this.spacesStore.spaceById(id)?.name ?? `Espacio ${id}`;
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(`${iso}T00:00:00`),
    );
  }

  protected isHourMark(time: string): boolean {
    return time.endsWith(':00');
  }
}
