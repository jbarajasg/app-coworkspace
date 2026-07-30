import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReservationRepository, SpaceRepository } from '../../../core/application/ports';
import { ReservationsStore } from '../../../core/application/reservations.store';
import {
  FakeReservationRepository,
  FakeSpaceRepository,
  isoDaysFromToday,
  makeReservation,
  settle,
} from '../../../testing/fakes';
import { ReservationFormPage } from './reservation-form-page';

describe('ReservationFormPage (integración)', () => {
  let spaceRepo: FakeSpaceRepository;
  let reservationRepo: FakeReservationRepository;

  beforeEach(() => {
    spaceRepo = new FakeSpaceRepository();
    reservationRepo = new FakeReservationRepository();
    TestBed.configureTestingModule({
      imports: [ReservationFormPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SpaceRepository, useValue: spaceRepo },
        { provide: ReservationRepository, useValue: reservationRepo },
      ],
    });
  });

  function fillForm(fixture: ComponentFixture<ReservationFormPage>, overrides = {}): void {
    (fixture.componentInstance as any).form.patchValue({
      spaceId: 1,
      date: isoDaysFromToday(5),
      startTime: '10:00',
      endTime: '12:00',
      requester: 'Laura Méndez',
      attendees: 4,
      purpose: 'Reunión',
      ...overrides,
    });
  }

  function submitForm(fixture: ComponentFixture<ReservationFormPage>): void {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
  }

  it('crea una reserva válida atravesando form → store → dominio → repo y navega al listado', async () => {
    const fixture = TestBed.createComponent(ReservationFormPage);
    await settle(fixture);
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const store = TestBed.inject(ReservationsStore);

    fillForm(fixture);
    await settle(fixture);
    submitForm(fixture);
    await settle(fixture);

    expect(store.reservations()).toHaveLength(1);
    expect(store.reservations()[0].requester).toBe('Laura Méndez');
    expect(navigateSpy).toHaveBeenCalledWith(['/reservas']);
  });

  it('RN-01: un solapamiento en el submit muestra el banner y no persiste', async () => {
    reservationRepo.seed = [makeReservation({ date: isoDaysFromToday(5) })];
    const fixture = TestBed.createComponent(ReservationFormPage);
    await settle(fixture);
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const store = TestBed.inject(ReservationsStore);

    fillForm(fixture, { startTime: '11:00', endTime: '13:00' });
    await settle(fixture);
    submitForm(fixture);
    await settle(fixture);

    expect(store.reservations()).toHaveLength(1);
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('RN-03: un formulario inválido no llega al store', async () => {
    const fixture = TestBed.createComponent(ReservationFormPage);
    await settle(fixture);
    const store = TestBed.inject(ReservationsStore);

    fillForm(fixture, { startTime: '10:00', endTime: '10:30' });
    await settle(fixture);
    submitForm(fixture);
    await settle(fixture);

    expect(store.reservations()).toHaveLength(0);
  });
});
