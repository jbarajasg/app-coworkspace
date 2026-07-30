import { describe, expect, it } from 'vitest';
import { makeReservation, makeSpace } from '../../../testing/fakes';
import { isReservationInProgress, resolveSpaceStatus } from './space-status';

const reservation = makeReservation();
const space = makeSpace();
const at = (time: string) => new Date(`2026-06-15T${time}:00`);

describe('resolveSpaceStatus', () => {
  it('mantenimiento tiene prioridad aunque haya reserva en curso', () => {
    const inMaintenance = makeSpace({ status: 'En mantenimiento' });
    expect(resolveSpaceStatus(inMaintenance, [reservation], at('11:00'))).toBe('En mantenimiento');
  });

  it('está Ocupado durante una reserva Confirmada en curso', () => {
    expect(resolveSpaceStatus(space, [reservation], at('10:00'))).toBe('Ocupado');
    expect(resolveSpaceStatus(space, [reservation], at('11:30'))).toBe('Ocupado');
  });

  it('está Disponible antes de empezar y a la hora exacta de fin', () => {
    expect(resolveSpaceStatus(space, [reservation], at('09:59'))).toBe('Disponible');
    expect(resolveSpaceStatus(space, [reservation], at('12:00'))).toBe('Disponible');
  });

  it('las reservas canceladas o de otro espacio no ocupan', () => {
    const cancelled = makeReservation({ status: 'Cancelada' });
    const otherSpace = makeReservation({ spaceId: 99 });
    expect(resolveSpaceStatus(space, [cancelled, otherSpace], at('11:00'))).toBe('Disponible');
  });

  it('otro día no ocupa', () => {
    expect(resolveSpaceStatus(space, [reservation], new Date('2026-06-16T11:00:00'))).toBe(
      'Disponible',
    );
  });

  describe('isReservationInProgress', () => {
    it('true dentro del rango, false en el borde de fin', () => {
      expect(isReservationInProgress(reservation, at('10:00'))).toBe(true);
      expect(isReservationInProgress(reservation, at('12:00'))).toBe(false);
    });

    it('false si no está Confirmada aunque el horario coincida', () => {
      expect(isReservationInProgress(makeReservation({ status: 'Completada' }), at('11:00'))).toBe(
        false,
      );
    });
  });
});
