import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Space } from '../../core/domain/models/space.model';
import { validateCapacity, validateSchedule } from '../../core/domain/rules/reservation-rules';

/**
 * Adaptadores: traducen las reglas puras del dominio al contrato de
 * Reactive Forms. La lógica vive en core/domain; aquí solo se mapea.
 */

/** RN-02 + RN-03 como validador de grupo (campos startTime/endTime). */
export function scheduleValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start: string = group.get('startTime')?.value;
    const end: string = group.get('endTime')?.value;
    if (!start || !end) return null;
    const violations = validateSchedule(start, end);
    return violations.length > 0 ? { schedule: violations } : null;
  };
}

/** RN-05 como validador de grupo; el espacio se resuelve vía lookup inyectado. */
export function capacityValidator(spaceLookup: (id: number) => Space | undefined): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const spaceId = Number(group.get('spaceId')?.value);
    const attendees = Number(group.get('attendees')?.value);
    if (!spaceId || !attendees) return null;
    const space = spaceLookup(spaceId);
    if (!space) return null;
    const violations = validateCapacity(attendees, space);
    return violations.length > 0 ? { capacity: violations } : null;
  };
}

/** Regla de UX (no de negocio): no tiene sentido reservar en el pasado. */
export function notPastDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value;
    if (!value) return null;
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return value < todayIso ? { pastDate: true } : null;
  };
}
