import { Reservation, ReservationDraft } from '../models/reservation.model';
import { Space } from '../models/space.model';
import {
  BUSINESS_END_MINUTES,
  BUSINESS_START_MINUTES,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  durationInMinutes,
  rangesOverlap,
  timeToMinutes,
} from './time';
import { RuleViolation, ValidationResult, VALID, invalid } from './validation';

export function validateSchedule(startTime: string, endTime: string): readonly RuleViolation[] {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const violations: RuleViolation[] = [];

  if (end <= start) {
    return [
      { code: 'INVALID_RANGE', message: 'La hora de fin debe ser posterior a la de inicio.' },
    ];
  }
  if (start < BUSINESS_START_MINUTES || end > BUSINESS_END_MINUTES) {
    violations.push({
      code: 'OUTSIDE_BUSINESS_HOURS',
      message: 'Las reservas solo se permiten entre 08:00 y 20:00.',
    });
  }
  const duration = end - start;
  if (duration < MIN_DURATION_MINUTES) {
    violations.push({ code: 'DURATION_TOO_SHORT', message: 'La duración mínima es de 1 hora.' });
  }
  if (duration > MAX_DURATION_MINUTES) {
    violations.push({ code: 'DURATION_TOO_LONG', message: 'La duración máxima es de 6 horas.' });
  }
  return violations;
}

export function findConflict(
  draft: Pick<ReservationDraft, 'spaceId' | 'date' | 'startTime' | 'endTime'>,
  existing: readonly Reservation[],
  excludeId?: number,
): Reservation | null {
  const start = timeToMinutes(draft.startTime);
  const end = timeToMinutes(draft.endTime);
  return (
    existing.find(
      (r) =>
        r.id !== excludeId &&
        r.status === 'Confirmada' &&
        r.spaceId === draft.spaceId &&
        r.date === draft.date &&
        rangesOverlap(start, end, timeToMinutes(r.startTime), timeToMinutes(r.endTime)),
    ) ?? null
  );
}

export function validateCapacity(attendees: number, space: Space): readonly RuleViolation[] {
  if (!Number.isInteger(attendees) || attendees < 1) {
    return [{ code: 'CAPACITY_EXCEEDED', message: 'Debe asistir al menos una persona.' }];
  }
  if (attendees > space.capacity) {
    return [
      {
        code: 'CAPACITY_EXCEEDED',
        message: `${space.name} admite máximo ${space.capacity} personas.`,
      },
    ];
  }
  return [];
}

export function validateSpaceAvailability(space: Space): readonly RuleViolation[] {
  return space.status === 'En mantenimiento'
    ? [{ code: 'SPACE_UNAVAILABLE', message: `${space.name} está en mantenimiento.` }]
    : [];
}

export function validateReservation(
  draft: ReservationDraft,
  space: Space,
  existing: readonly Reservation[],
): ValidationResult {
  const violations: RuleViolation[] = [
    ...validateSchedule(draft.startTime, draft.endTime),
    ...validateCapacity(draft.attendees, space),
    ...validateSpaceAvailability(space),
  ];
  if (findConflict(draft, existing)) {
    violations.push({
      code: 'OVERLAP',
      message: 'El espacio ya tiene una reserva confirmada en ese horario.',
    });
  }
  return violations.length > 0 ? invalid(violations) : VALID;
}
