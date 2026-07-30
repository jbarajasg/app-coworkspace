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

describe('rangesOverlap (intervalos semiabiertos)', () => {
  it('detecta solapamiento parcial', () => {
    expect(rangesOverlap(600, 720, 660, 780)).toBe(true); // 10-12 vs 11-13
  });

  it('detecta contención total', () => {
    expect(rangesOverlap(600, 720, 630, 690)).toBe(true); // 10-12 contiene 10:30-11:30
  });

  it('NO considera solapamiento cuando un rango empieza exactamente al terminar el otro', () => {
    expect(rangesOverlap(600, 720, 720, 840)).toBe(false); // 10-12 vs 12-14
    expect(rangesOverlap(720, 840, 600, 720)).toBe(false); // simétrico
  });
});
