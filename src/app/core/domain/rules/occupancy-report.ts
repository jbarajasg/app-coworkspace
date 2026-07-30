import type { Reservation } from '../models/reservation.model';
import type { Space } from '../models/space.model';
import { BUSINESS_END_MINUTES, BUSINESS_START_MINUTES, durationInMinutes } from './time';

export const BUSINESS_MINUTES_PER_DAY = BUSINESS_END_MINUTES - BUSINESS_START_MINUTES;

const OCCUPYING_STATUSES: ReadonlySet<Reservation['status']> = new Set([
  'Confirmada',
  'Completada',
]);

const MS_PER_DAY = 86_400_000;

export interface SpaceOccupancy {
  readonly spaceId: number;
  readonly spaceName: string;
  readonly reservations: number;
  readonly reservedMinutes: number;
  readonly occupancyPct: number;
  readonly penalizedCancellations: number;
  readonly estimatedRevenue: number;
}

export interface OccupancyReport {
  readonly from: string;
  readonly to: string;
  readonly daysInRange: number;
  readonly totalReservations: number;
  readonly totalReservedMinutes: number;
  readonly averageOccupancyPct: number;
  readonly totalPenalizedCancellations: number;
  readonly totalEstimatedRevenue: number;
  readonly bySpace: readonly SpaceOccupancy[];
  readonly topSpace: SpaceOccupancy | null;
}

export function countDaysInRange(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }
  return Math.round((end - start) / MS_PER_DAY) + 1;
}

export function computeOccupancyReport(
  spaces: readonly Space[],
  reservations: readonly Reservation[],
  from: string,
  to: string,
): OccupancyReport {
  const days = countDaysInRange(from, to);
  const availableMinutesPerSpace = days * BUSINESS_MINUTES_PER_DAY;
  const inRange = reservations.filter((r) => r.date >= from && r.date <= to);

  const bySpace: readonly SpaceOccupancy[] = spaces.map((space) => {
    const own = inRange.filter((r) => r.spaceId === space.id);
    const occupying = own.filter((r) => OCCUPYING_STATUSES.has(r.status));
    const reservedMinutes = occupying.reduce(
      (total, r) => total + durationInMinutes(r.startTime, r.endTime),
      0,
    );

    return {
      spaceId: space.id,
      spaceName: space.name,
      reservations: occupying.length,
      reservedMinutes,
      occupancyPct:
        availableMinutesPerSpace === 0
          ? 0
          : round1((reservedMinutes / availableMinutesPerSpace) * 100),
      penalizedCancellations: own.filter((r) => r.status === 'Cancelada con penalización').length,
      estimatedRevenue: round1((reservedMinutes / 60) * space.pricePerHour),
    };
  });

  const totalReservedMinutes = bySpace.reduce((total, s) => total + s.reservedMinutes, 0);
  const totalAvailableMinutes = availableMinutesPerSpace * spaces.length;
  const topSpace = bySpace.reduce<SpaceOccupancy | null>(
    (top, s) =>
      s.reservedMinutes > 0 && (top === null || s.reservedMinutes > top.reservedMinutes) ? s : top,
    null,
  );

  return {
    from,
    to,
    daysInRange: days,
    totalReservations: bySpace.reduce((total, s) => total + s.reservations, 0),
    totalReservedMinutes,
    averageOccupancyPct:
      totalAvailableMinutes === 0
        ? 0
        : round1((totalReservedMinutes / totalAvailableMinutes) * 100),
    totalPenalizedCancellations: bySpace.reduce((total, s) => total + s.penalizedCancellations, 0),
    totalEstimatedRevenue: round1(bySpace.reduce((total, s) => total + s.estimatedRevenue, 0)),
    bySpace,
    topSpace,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
