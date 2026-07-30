import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Reservation, ReservationDraft } from '../domain/models/reservation.model';
import type { Space } from '../domain/models/space.model';
import { ReservationRepository } from './ports';
import { ReservationsStore } from './reservations.store';

/**
 * Fake del puerto: instantáneo (sin latencia) y controlable.
 * Demuestra el valor de Clean Architecture: el store se prueba
 * sin tocar la infraestructura real.
 */
class FakeReservationRepository extends ReservationRepository {
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

function makeSpace(overrides: Partial<Space> = {}): Space {
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

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
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

function makeDraft(overrides: Partial<ReservationDraft> = {}): ReservationDraft {
  const { id: _id, status: _status, ...draft } = makeReservation();
  return { ...draft, ...overrides };
}

describe('ReservationsStore', () => {
  let repository: FakeReservationRepository;
  let store: ReservationsStore;

  beforeEach(() => {
    repository = new FakeReservationRepository();
    TestBed.configureTestingModule({
      providers: [{ provide: ReservationRepository, useValue: repository }],
    });
    store = TestBed.inject(ReservationsStore);
  });

  it('load() carga las reservas del repositorio', async () => {
    repository.seed = [makeReservation()];

    await store.load();

    expect(store.reservations()).toHaveLength(1);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('create() persiste una reserva válida y la agrega al estado', async () => {
    const result = await store.create(makeDraft(), makeSpace());

    expect(result.valid).toBe(true);
    expect(store.reservations()).toHaveLength(1);
    expect(store.reservations()[0].status).toBe('Confirmada');
  });

  it('RN-01: create() rechaza un solapamiento y no persiste', async () => {
    repository.seed = [makeReservation()];
    await store.load();

    const result = await store.create(
      makeDraft({ startTime: '11:00', endTime: '13:00' }),
      makeSpace(),
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.violations.map((v) => v.code)).toContain('OVERLAP');
    }
    expect(store.reservations()).toHaveLength(1);
  });

  it('create() traduce un fallo del repositorio a violación PERSISTENCE', async () => {
    repository.failNextCreate = true;

    const result = await store.create(makeDraft(), makeSpace());

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.violations.map((v) => v.code)).toContain('PERSISTENCE');
    }
    expect(store.reservations()).toHaveLength(0);
  });

  it('RN-04: cancelar con más de 24h queda como Cancelada', async () => {
    repository.seed = [makeReservation()];
    await store.load();

    await store.cancel(1, new Date('2026-06-10T10:00:00'));

    expect(store.reservations()[0].status).toBe('Cancelada');
  });

  it('RN-04: cancelar con menos de 24h aplica penalización', async () => {
    repository.seed = [makeReservation()];
    await store.load();

    await store.cancel(1, new Date('2026-06-15T08:00:00'));

    expect(store.reservations()[0].status).toBe('Cancelada con penalización');
  });

  it('cancel() ignora reservas que no están Confirmadas', async () => {
    repository.seed = [makeReservation({ status: 'Completada' })];
    await store.load();

    await store.cancel(1, new Date('2026-06-10T10:00:00'));

    expect(store.reservations()[0].status).toBe('Completada');
  });

  it('complete() marca una reserva Confirmada como Completada', async () => {
    repository.seed = [makeReservation()];
    await store.load();

    await store.complete(1);

    expect(store.reservations()[0].status).toBe('Completada');
  });
});
