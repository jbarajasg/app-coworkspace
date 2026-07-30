import type { ComponentFixture } from '@angular/core/testing';
import { ReservationRepository, SpaceRepository } from '../core/application/ports';
import type { Reservation, ReservationDraft } from '../core/domain/models/reservation.model';
import type { Space } from '../core/domain/models/space.model';

export function makeSpace(overrides: Partial<Space> = {}): Space {
  return {
    id: 1,
    name: 'Sala Aurora',
    type: 'Sala de reuniones',
    capacity: 8,
    pricePerHour: 25,
    features: [],
    status: 'Disponible',
    ...overrides,
  };
}

export function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 1,
    spaceId: 1,
    date: '2026-06-15',
    startTime: '10:00',
    endTime: '12:00',
    requester: 'María López',
    attendees: 4,
    purpose: 'Reunión',
    status: 'Confirmada',
    ...overrides,
  };
}

export function makeDraft(overrides: Partial<ReservationDraft> = {}): ReservationDraft {
  const { id: _id, status: _status, ...draft } = makeReservation();
  return { ...draft, ...overrides };
}

export function isoDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Fakes instantáneos de los puertos: sin latencia y controlables. */
export class FakeSpaceRepository extends SpaceRepository {
  seed: Space[] = [makeSpace()];
  failNext = false;

  async findAll(): Promise<readonly Space[]> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('fallo simulado');
    }
    return [...this.seed];
  }
}

export class FakeReservationRepository extends ReservationRepository {
  seed: Reservation[] = [];
  failNextCreate = false;
  private nextId = 100;

  async findAll(): Promise<readonly Reservation[]> {
    return [...this.seed];
  }

  async create(draft: ReservationDraft): Promise<Reservation> {
    if (this.failNextCreate) {
      this.failNextCreate = false;
      throw new Error('fallo simulado de persistencia');
    }
    return { ...draft, id: this.nextId++, status: 'Confirmada' };
  }

  async updateStatus(id: number, status: Reservation['status']): Promise<Reservation> {
    const current = this.seed.find((r) => r.id === id);
    if (!current) throw new Error(`No existe una reserva con id ${id}.`);
    return { ...current, status };
  }
}

/**
 * Deja el fixture estable: agota los microtasks de los stores
 * (load/create/cancel son async) y fuerza change detection zoneless.
 */
export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

/** Click en el primer botón cuyo texto (trim) coincida exactamente. */
export function clickButton(fixture: ComponentFixture<unknown>, text: string): void {
  const buttons = Array.from(
    fixture.nativeElement.querySelectorAll('button'),
  ) as HTMLButtonElement[];
  const target = buttons.find((b) => b.textContent?.trim() === text);
  if (!target) throw new Error(`No se encontró el botón "${text}"`);
  target.click();
}
