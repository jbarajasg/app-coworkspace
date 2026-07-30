import { Injectable } from '@angular/core';
import { ReservationRepository, SpaceRepository } from '../application/ports';
import {
  Reservation,
  ReservationDraft,
  ReservationStatus,
} from '../domain/models/reservation.model';
import { Space } from '../domain/models/space.model';
import { SEED_RESERVATIONS, SEED_SPACES } from './mock-data';

const LATENCY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class InMemorySpaceRepository extends SpaceRepository {
  private readonly spaces = [...SEED_SPACES];

  async findAll(): Promise<readonly Space[]> {
    await delay(LATENCY_MS);
    return structuredClone(this.spaces);
  }
}

@Injectable()
export class InMemoryReservationRepository extends ReservationRepository {
  private reservations: Reservation[] = [...SEED_RESERVATIONS];
  private nextId = Math.max(...this.reservations.map((r) => r.id)) + 1;

  async findAll(): Promise<readonly Reservation[]> {
    await delay(LATENCY_MS);
    return structuredClone(this.reservations);
  }

  async create(draft: ReservationDraft): Promise<Reservation> {
    await delay(LATENCY_MS);
    const created: Reservation = { ...draft, id: this.nextId++, status: 'Confirmada' };
    this.reservations = [...this.reservations, created];
    return structuredClone(created);
  }

  async updateStatus(id: number, status: ReservationStatus): Promise<Reservation> {
    await delay(LATENCY_MS);
    const current = this.reservations.find((r) => r.id === id);
    if (!current) {
      throw new Error(`No existe una reserva con id ${id}.`);
    }
    const updated: Reservation = { ...current, status };
    this.reservations = this.reservations.map((r) => (r.id === id ? updated : r));
    return structuredClone(updated);
  }
}
