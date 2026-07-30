import { describe, expect, it } from 'vitest';
import { durationInMinutes, minutesToTime, rangesOverlap, timeToMinutes } from './time';

describe('timeToMinutes', () => {
  it('convierte HH:mm a minutos desde medianoche', () => {
    expect(timeToMinutes('08:00')).toBe(480);
    expect(timeToMinutes('20:00')).toBe(1200);
    expect(timeToMinutes('10:30')).toBe(630);
  });
});

describe('minutesToTime', () => {
  it('convierte minutos a HH:mm con relleno de ceros', () => {
    expect(minutesToTime(480)).toBe('08:00');
    expect(minutesToTime(630)).toBe('10:30');
    expect(minutesToTime(1200)).toBe('20:00');
  });
});

describe('durationInMinutes', () => {
  it('calcula la duración de un rango', () => {
    expect(durationInMinutes('10:00', '12:00')).toBe(120);
  });
});

describe('rangesOverlap (intervalos cerrados, según RN-01 literal)', () => {
  it('detecta solapamiento parcial', () => {
    expect(rangesOverlap(600, 720, 660, 780)).toBe(true);
  });

  it('detecta contención total', () => {
    expect(rangesOverlap(600, 720, 630, 690)).toBe(true);
  });

  it('considera conflicto los rangos consecutivos que comparten borde (enunciado: 12:00-14:00 tras 10:00-12:00)', () => {
    expect(rangesOverlap(600, 720, 720, 840)).toBe(true);
    expect(rangesOverlap(720, 840, 600, 720)).toBe(true);
  });

  it('no hay conflicto cuando existe separación real entre rangos', () => {
    expect(rangesOverlap(600, 720, 750, 810)).toBe(false);
  });
});
