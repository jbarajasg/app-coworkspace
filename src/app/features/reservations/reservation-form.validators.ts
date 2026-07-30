import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Space } from '../../core/domain/models/space.model';
import { validateCapacity, validateSchedule } from '../../core/domain/rules/reservation-rules';

export function scheduleValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start: string = group.get('startTime')?.value;
    const end: string = group.get('endTime')?.value;
    if (!start || !end) return null;
    const violations = validateSchedule(start, end);
    return violations.length > 0 ? { schedule: violations } : null;
  };
}

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

export function notPastDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value;
    if (!value) return null;
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return value < todayIso ? { pastDate: true } : null;
  };
}
