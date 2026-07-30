import { describe, expect, it } from 'vitest';
import { Reservation, ReservationDraft } from '../models/reservation.model';
import { Space } from '../models/space.model';
import {
  findConflict,
  validateCapacity,
  validateReservation,
  validateSchedule,
  validateSpaceAvailability,
} from './reservation-rules';

// --- Test data builders ---------------------------------------------------

function makeSpace(overrides: Partial<Space> = {}): Space {
  return {
    id: 1,
    name: 'Sala Aurora',
    type: 'Sala de reuniones',
    capacity: 6,
    pricePerHour: 25,
    features: ['WiFi', 'Proyector'],
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

function makeDraft(overrides: Partial<ReservationDraft> = {}): ReservationDraft {
  return {
    spaceId: 1,
    date: '2026-06-15',
    startTime: '14:00',
    endTime: '16:00',
    requester: 'Carlos Ruiz',
    attendees: 4,
    purpose: 'Reunión',
    ...overrides,
  };
}

const codes = (violations: readonly { code: string }[]) => violations.map((v) => v.code);

// --- RN-02 / RN-03: horario laboral y duración ----------------------------

describe('validateSchedule', () => {
  it('acepta un rango válido dentro del horario laboral', () => {
    expect(validateSchedule('10:00', '12:00')).toEqual([]);
  });

  it('acepta los bordes exactos del horario laboral (08:00-09:00 y 19:00-20:00)', () => {
    expect(validateSchedule('08:00', '09:00')).toEqual([]);
    expect(validateSchedule('19:00', '20:00')).toEqual([]);
  });

  it('rechaza reservas que empiezan antes de las 08:00', () => {
    expect(codes(validateSchedule('07:00', '09:00'))).toContain('OUTSIDE_BUSINESS_HOURS');
  });

  it('rechaza reservas que terminan después de las 20:00', () => {
    expect(codes(validateSchedule('19:00', '20:30'))).toContain('OUTSIDE_BUSINESS_HOURS');
  });

  it('rechaza fin anterior o igual al inicio, sin acumular otras violaciones', () => {
    expect(codes(validateSchedule('12:00', '12:00'))).toEqual(['INVALID_RANGE']);
    expect(codes(validateSchedule('12:00', '10:00'))).toEqual(['INVALID_RANGE']);
  });

  it('rechaza duración menor a 1 hora', () => {
    expect(codes(validateSchedule('10:00', '10:30'))).toContain('DURATION_TOO_SHORT');
  });

  it('acepta exactamente 1 hora y exactamente 6 horas (límites inclusivos)', () => {
    expect(validateSchedule('10:00', '11:00')).toEqual([]);
    expect(validateSchedule('08:00', '14:00')).toEqual([]);
  });

  it('rechaza duración mayor a 6 horas', () => {
    expect(codes(validateSchedule('08:00', '15:00'))).toContain('DURATION_TOO_LONG');
  });
});

// --- RN-01: prevención de overbooking -------------------------------------

describe('findConflict', () => {
  const existing = [makeReservation()]; // 10:00-12:00 Confirmada

  it('detecta solapamiento parcial (caso del enunciado: 11:00-13:00)', () => {
    const draft = makeDraft({ startTime: '11:00', endTime: '13:00' });
    expect(findConflict(draft, existing)).not.toBeNull();
  });

  it('ignora reservas de otro espacio o de otra fecha', () => {
    const sameTimeOtherSpace = makeDraft({ spaceId: 2, startTime: '10:00', endTime: '12:00' });
    const sameTimeOtherDate = makeDraft({
      date: '2026-06-16',
      startTime: '10:00',
      endTime: '12:00',
    });
    expect(findConflict(sameTimeOtherSpace, existing)).toBeNull();
    expect(findConflict(sameTimeOtherDate, existing)).toBeNull();
  });

  it('ignora reservas canceladas o completadas (solo Confirmada bloquea)', () => {
    const draft = makeDraft({ startTime: '10:00', endTime: '12:00' });
    expect(findConflict(draft, [makeReservation({ status: 'Cancelada' })])).toBeNull();
    expect(findConflict(draft, [makeReservation({ status: 'Completada' })])).toBeNull();
  });

  it('excluye la propia reserva al editar (excludeId)', () => {
    const draft = makeDraft({ startTime: '10:00', endTime: '12:00' });
    expect(findConflict(draft, existing, 1)).toBeNull();
  });

  it('rechaza reservas consecutivas que comparten borde (caso del enunciado: 12:00-14:00)', () => {
    const draft = makeDraft({ startTime: '12:00', endTime: '14:00' });
    expect(findConflict(draft, existing)).not.toBeNull();
  });

  it('permite reservas con separación real (12:30-14:00 tras 10:00-12:00)', () => {
    const draft = makeDraft({ startTime: '12:30', endTime: '14:00' });
    expect(findConflict(draft, existing)).toBeNull();
  });
});

// --- RN-05: capacidad ------------------------------------------------------

describe('validateCapacity', () => {
  const space = makeSpace({ capacity: 6 });

  it('acepta hasta la capacidad máxima inclusive', () => {
    expect(validateCapacity(6, space)).toEqual([]);
    expect(validateCapacity(1, space)).toEqual([]);
  });

  it('rechaza exceder la capacidad', () => {
    expect(codes(validateCapacity(7, space))).toContain('CAPACITY_EXCEEDED');
  });

  it('rechaza valores no válidos (0, negativos, decimales)', () => {
    expect(codes(validateCapacity(0, space))).toContain('CAPACITY_EXCEEDED');
    expect(codes(validateCapacity(-1, space))).toContain('CAPACITY_EXCEEDED');
    expect(codes(validateCapacity(2.5, space))).toContain('CAPACITY_EXCEEDED');
  });
});

// --- Espacio en mantenimiento ----------------------------------------------

describe('validateSpaceAvailability', () => {
  it('rechaza espacios en mantenimiento', () => {
    const space = makeSpace({ status: 'En mantenimiento' });
    expect(codes(validateSpaceAvailability(space))).toContain('SPACE_UNAVAILABLE');
  });

  it('acepta espacios disponibles u ocupados', () => {
    expect(validateSpaceAvailability(makeSpace({ status: 'Disponible' }))).toEqual([]);
    expect(validateSpaceAvailability(makeSpace({ status: 'Ocupado' }))).toEqual([]);
  });
});

// --- Orquestador -----------------------------------------------------------

describe('validateReservation', () => {
  it('devuelve valid=true cuando todas las reglas pasan', () => {
    const result = validateReservation(makeDraft(), makeSpace(), [makeReservation()]);
    expect(result.valid).toBe(true);
  });

  it('acumula múltiples violaciones a la vez', () => {
    const draft = makeDraft({ startTime: '06:00', endTime: '06:30', attendees: 99 });
    const result = validateReservation(draft, makeSpace(), []);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(codes(result.violations)).toEqual(
        expect.arrayContaining([
          'OUTSIDE_BUSINESS_HOURS',
          'DURATION_TOO_SHORT',
          'CAPACITY_EXCEEDED',
        ]),
      );
    }
  });

  it('incluye OVERLAP cuando hay conflicto de horario', () => {
    const draft = makeDraft({ startTime: '11:00', endTime: '13:00' });
    const result = validateReservation(draft, makeSpace(), [makeReservation()]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(codes(result.violations)).toContain('OVERLAP');
    }
  });
});
