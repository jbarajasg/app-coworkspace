import { describe, expect, it } from 'vitest';
import type { Reservation } from '../models/reservation.model';
import type { Space } from '../models/space.model';
import { computeOccupancyReport, countDaysInRange } from './occupancy-report';

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

describe('countDaysInRange', () => {
  it('cuenta 1 día cuando from y to son iguales', () => {
    expect(countDaysInRange('2026-06-15', '2026-06-15')).toBe(1);
  });

  it('cuenta el rango inclusivo', () => {
    expect(countDaysInRange('2026-06-15', '2026-06-21')).toBe(7);
  });

  it('devuelve 0 con rango invertido', () => {
    expect(countDaysInRange('2026-06-21', '2026-06-15')).toBe(0);
  });
});

describe('computeOccupancyReport', () => {
  it('devuelve ceros y sin espacio top cuando no hay reservas', () => {
    const report = computeOccupancyReport([makeSpace()], [], '2026-06-15', '2026-06-15');

    expect(report.totalReservations).toBe(0);
    expect(report.averageOccupancyPct).toBe(0);
    expect(report.topSpace).toBeNull();
  });

  it('calcula minutos, porcentaje e ingresos para un día y un espacio', () => {
    // 2h de 12h operables = 16.7%; 2h × $25 = $50
    const report = computeOccupancyReport(
      [makeSpace()],
      [makeReservation()],
      '2026-06-15',
      '2026-06-15',
    );

    expect(report.totalReservedMinutes).toBe(120);
    expect(report.averageOccupancyPct).toBe(16.7);
    expect(report.bySpace[0].estimatedRevenue).toBe(50);
    expect(report.topSpace?.spaceId).toBe(1);
  });

  it('excluye reservas fuera del rango', () => {
    const report = computeOccupancyReport(
      [makeSpace()],
      [makeReservation({ date: '2026-06-14' }), makeReservation({ id: 2, date: '2026-06-16' })],
      '2026-06-15',
      '2026-06-15',
    );

    expect(report.totalReservations).toBe(0);
  });

  it('las completadas ocupan; las canceladas no', () => {
    const report = computeOccupancyReport(
      [makeSpace()],
      [
        makeReservation({ status: 'Completada' }),
        makeReservation({ id: 2, startTime: '14:00', endTime: '16:00', status: 'Cancelada' }),
      ],
      '2026-06-15',
      '2026-06-15',
    );

    expect(report.totalReservations).toBe(1);
    expect(report.totalReservedMinutes).toBe(120);
  });

  it('RN-04: registra las cancelaciones con penalización sin sumarlas a la ocupación', () => {
    const report = computeOccupancyReport(
      [makeSpace()],
      [makeReservation({ status: 'Cancelada con penalización' })],
      '2026-06-15',
      '2026-06-15',
    );

    expect(report.totalPenalizedCancellations).toBe(1);
    expect(report.totalReservedMinutes).toBe(0);
    expect(report.topSpace).toBeNull();
  });

  it('identifica el espacio con mayor ocupación', () => {
    const report = computeOccupancyReport(
      [makeSpace(), makeSpace({ id: 2, name: 'Sala Nebula' })],
      [
        makeReservation(),
        makeReservation({ id: 2, spaceId: 2, startTime: '08:00', endTime: '13:00' }),
      ],
      '2026-06-15',
      '2026-06-15',
    );

    expect(report.topSpace?.spaceName).toBe('Sala Nebula');
  });

  it('rango invertido no produce NaN', () => {
    const report = computeOccupancyReport(
      [makeSpace()],
      [makeReservation()],
      '2026-06-21',
      '2026-06-15',
    );

    expect(report.daysInRange).toBe(0);
    expect(report.averageOccupancyPct).toBe(0);
    expect(report.bySpace[0].occupancyPct).toBe(0);
  });
});
