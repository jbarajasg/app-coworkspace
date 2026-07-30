import { describe, expect, it } from 'vitest';
import { resolveCancellationStatus } from './cancellation';

describe('resolveCancellationStatus (RN-04)', () => {
  const reservation = { date: '2026-06-15', startTime: '10:00' };

  it('cancela sin penalización con más de 24h de anticipación', () => {
    const now = new Date('2026-06-13T10:00:00');
    expect(resolveCancellationStatus(reservation, now)).toBe('Cancelada');
  });

  it('penaliza con menos de 24h de anticipación', () => {
    const now = new Date('2026-06-14T20:00:00');
    expect(resolveCancellationStatus(reservation, now)).toBe('Cancelada con penalización');
  });

  it('penaliza en el límite exacto de 24h (la regla exige MÁS de 24h)', () => {
    const now = new Date('2026-06-14T10:00:00');
    expect(resolveCancellationStatus(reservation, now)).toBe('Cancelada con penalización');
  });

  it('un minuto por encima de 24h no penaliza', () => {
    const now = new Date('2026-06-14T09:59:00');
    expect(resolveCancellationStatus(reservation, now)).toBe('Cancelada');
  });

  it('penaliza si la reserva ya comenzó', () => {
    const now = new Date('2026-06-15T11:00:00');
    expect(resolveCancellationStatus(reservation, now)).toBe('Cancelada con penalización');
  });
});
