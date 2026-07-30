import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReservationRepository, SpaceRepository } from '../../../core/application/ports';
import { ReservationsStore } from '../../../core/application/reservations.store';
import {
  clickButton,
  FakeReservationRepository,
  FakeSpaceRepository,
  isoDaysFromToday,
  makeReservation,
  settle,
} from '../../../testing/fakes';
import { ReservationsPage } from './reservations-page';

describe('ReservationsPage (integración)', () => {
  let spaceRepo: FakeSpaceRepository;
  let reservationRepo: FakeReservationRepository;

  beforeEach(() => {
    spaceRepo = new FakeSpaceRepository();
    reservationRepo = new FakeReservationRepository();
    TestBed.configureTestingModule({
      imports: [ReservationsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SpaceRepository, useValue: spaceRepo },
        { provide: ReservationRepository, useValue: reservationRepo },
      ],
    });
  });

  it('RN-04: cancelar con más de 24h no aplica penalización', async () => {
    reservationRepo.seed = [makeReservation({ date: isoDaysFromToday(5) })];
    const fixture = TestBed.createComponent(ReservationsPage);
    await settle(fixture);

    clickButton(fixture, 'Cancelar');
    await settle(fixture);

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).not.toContain('penalización');

    clickButton(fixture, 'Sí, cancelar');
    await settle(fixture);

    expect(TestBed.inject(ReservationsStore).reservations()[0].status).toBe('Cancelada');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('RN-04: cancelar el mismo día muestra el aviso y aplica penalización', async () => {
    reservationRepo.seed = [
      makeReservation({ date: isoDaysFromToday(0), startTime: '19:00', endTime: '20:00' }),
    ];
    const fixture = TestBed.createComponent(ReservationsPage);
    await settle(fixture);

    clickButton(fixture, 'Cancelar');
    await settle(fixture);

    expect(fixture.nativeElement.querySelector('[role="dialog"]').textContent).toContain(
      'penalización',
    );

    clickButton(fixture, 'Sí, cancelar');
    await settle(fixture);

    expect(TestBed.inject(ReservationsStore).reservations()[0].status).toBe(
      'Cancelada con penalización',
    );
  });

  it('completar una reserva Confirmada la marca como Completada', async () => {
    reservationRepo.seed = [makeReservation({ date: isoDaysFromToday(5) })];
    const fixture = TestBed.createComponent(ReservationsPage);
    await settle(fixture);

    clickButton(fixture, 'Completar');
    await settle(fixture);

    expect(TestBed.inject(ReservationsStore).reservations()[0].status).toBe('Completada');
  });

  it('las reservas no Confirmadas no muestran acciones', async () => {
    reservationRepo.seed = [makeReservation({ status: 'Completada' })];
    const fixture = TestBed.createComponent(ReservationsPage);
    await settle(fixture);

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    expect(buttons.some((b) => b.textContent?.trim() === 'Cancelar')).toBe(false);
  });
});
