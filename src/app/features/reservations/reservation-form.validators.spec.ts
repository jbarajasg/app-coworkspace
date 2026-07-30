import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import type { Space } from '../../core/domain/models/space.model';
import type { RuleViolation } from '../../core/domain/rules/validation';
import {
  capacityValidator,
  notPastDateValidator,
  scheduleValidator,
} from './reservation-form.validators';

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

function scheduleGroup(startTime: string, endTime: string): FormGroup {
  return new FormGroup({
    startTime: new FormControl(startTime),
    endTime: new FormControl(endTime),
  });
}

function capacityGroup(spaceId: number | string, attendees: number | string): FormGroup {
  return new FormGroup({
    spaceId: new FormControl(spaceId),
    attendees: new FormControl(attendees),
  });
}

function codes(violations: RuleViolation[] | undefined): string[] {
  return (violations ?? []).map((v) => v.code);
}

function isoDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

describe('scheduleValidator', () => {
  const validate = scheduleValidator();

  it('acepta un horario válido dentro del rango operable', () => {
    expect(validate(scheduleGroup('10:00', '12:00'))).toBeNull();
  });

  it('no valida mientras falten campos (eso es responsabilidad de required)', () => {
    expect(validate(scheduleGroup('', '12:00'))).toBeNull();
  });

  it('RN-02: rechaza horarios fuera de 08:00-20:00', () => {
    const errors = validate(scheduleGroup('07:00', '09:00'));
    expect(codes(errors?.['schedule'])).toContain('OUTSIDE_BUSINESS_HOURS');
  });

  it('RN-03: rechaza duración menor a 1 hora', () => {
    const errors = validate(scheduleGroup('10:00', '10:30'));
    expect(codes(errors?.['schedule'])).toContain('DURATION_TOO_SHORT');
  });

  it('RN-03: rechaza duración mayor a 6 horas', () => {
    const errors = validate(scheduleGroup('08:00', '15:00'));
    expect(codes(errors?.['schedule'])).toContain('DURATION_TOO_LONG');
  });

  it('un rango invertido solo reporta INVALID_RANGE (corto-circuito)', () => {
    const errors = validate(scheduleGroup('12:00', '10:00'));
    expect(codes(errors?.['schedule'])).toEqual(['INVALID_RANGE']);
  });
});

describe('capacityValidator', () => {
  const space = makeSpace({ capacity: 8 });
  const validate = capacityValidator((id) => (id === 1 ? space : undefined));

  it('acepta asistentes hasta la capacidad exacta', () => {
    expect(validate(capacityGroup(1, 8))).toBeNull();
  });

  it('RN-05: rechaza asistentes por encima de la capacidad', () => {
    const errors = validate(capacityGroup(1, 9));
    expect(codes(errors?.['capacity'])).toContain('CAPACITY_EXCEEDED');
  });

  it('no valida si el espacio aún no está seleccionado', () => {
    expect(validate(capacityGroup('', 5))).toBeNull();
  });

  it('no valida si el lookup no encuentra el espacio', () => {
    expect(validate(capacityGroup(999, 5))).toBeNull();
  });
});

describe('notPastDateValidator', () => {
  const validate = notPastDateValidator();

  it('rechaza fechas anteriores a hoy', () => {
    expect(validate(new FormControl(isoDaysFromToday(-1)))).toEqual({ pastDate: true });
  });

  it('acepta hoy y fechas futuras', () => {
    expect(validate(new FormControl(isoDaysFromToday(0)))).toBeNull();
    expect(validate(new FormControl(isoDaysFromToday(1)))).toBeNull();
  });

  it('no valida vacío (responsabilidad de required)', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});
