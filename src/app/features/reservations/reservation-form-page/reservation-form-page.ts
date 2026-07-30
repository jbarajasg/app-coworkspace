import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ReservationsStore } from '../../../core/application/reservations.store';
import { SpacesStore } from '../../../core/application/spaces.store';
import {
  RESERVATION_PURPOSES,
  ReservationDraft,
  ReservationPurpose,
} from '../../../core/domain/models/reservation.model';
import {
  BUSINESS_END_MINUTES,
  BUSINESS_START_MINUTES,
  MIN_DURATION_MINUTES,
  durationInMinutes,
  minutesToTime,
  timeToMinutes,
} from '../../../core/domain/rules/time';
import { RuleViolation } from '../../../core/domain/rules/validation';
import { validateSchedule } from '../../../core/domain/rules/reservation-rules';
import {
  capacityValidator,
  notPastDateValidator,
  scheduleValidator,
} from '../reservation-form.validators';

function slots(fromMinutes: number, toMinutes: number): readonly string[] {
  const result: string[] = [];
  for (let m = fromMinutes; m <= toMinutes; m += 30) result.push(minutesToTime(m));
  return result;
}

@Component({
  selector: 'app-reservation-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservation-form-page.html',
})
export class ReservationFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  protected readonly spacesStore = inject(SpacesStore);
  private readonly reservationsStore = inject(ReservationsStore);

  readonly fecha = input<string>();
  readonly inicio = input<string>();

  /** Query param `?espacio=` enlazado por withComponentInputBinding. */
  readonly espacio = input<string>();

  protected readonly purposes = RESERVATION_PURPOSES;
  protected readonly startOptions = slots(
    BUSINESS_START_MINUTES,
    BUSINESS_END_MINUTES - MIN_DURATION_MINUTES,
  );
  protected readonly endOptions = slots(
    BUSINESS_START_MINUTES + MIN_DURATION_MINUTES,
    BUSINESS_END_MINUTES,
  );
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly form = this.fb.group(
    {
      spaceId: [0, [Validators.required, Validators.min(1)]],
      date: ['', [Validators.required, notPastDateValidator()]],
      startTime: ['09:00', Validators.required],
      endTime: ['10:00', Validators.required],
      requester: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
      attendees: [1, [Validators.required, Validators.min(1)]],
      purpose: this.fb.control<ReservationPurpose>('Reunión', Validators.required),
    },
    {
      validators: [scheduleValidator(), capacityValidator((id) => this.spacesStore.spaceById(id))],
    },
  );

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly selectedSpace = computed(() =>
    this.spacesStore.spaceById(Number(this.formValue().spaceId ?? 0)),
  );

  /** Coste estimado en vivo: duración × precio/hora del espacio elegido. */
  protected readonly estimatedCost = computed(() => {
    const { startTime, endTime } = this.formValue();
    const space = this.selectedSpace();
    if (!space || !startTime || !endTime) return null;
    if (validateSchedule(startTime, endTime).length > 0) return null;
    return (durationInMinutes(startTime, endTime) / 60) * space.pricePerHour;
  });

  protected readonly submitting = signal(false);
  protected readonly submitViolations = signal<readonly RuleViolation[]>([]);

  constructor() {
    void this.spacesStore.load();
    void this.reservationsStore.load(); // estado necesario para RN-01 en el submit

    effect(() => {
      const fecha = this.fecha();
      if (fecha) this.form.patchValue({ date: fecha });
      const inicio = this.inicio();
      if (inicio) {
        const end = Math.min(timeToMinutes(inicio) + MIN_DURATION_MINUTES, BUSINESS_END_MINUTES);
        this.form.patchValue({ startTime: inicio, endTime: minutesToTime(end) });
      }
    });
    // Preselección desde ?espacio= cuando los espacios ya cargaron.
    effect(() => {
      const id = Number(this.espacio());
      if (id > 0 && this.spacesStore.spaceById(id)) {
        this.form.patchValue({ spaceId: id });
      }
    });
  }

  protected invalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected groupErrors(key: 'schedule' | 'capacity'): readonly RuleViolation[] {
    const errors = this.form.errors?.[key] as readonly RuleViolation[] | undefined;
    const start = this.form.controls.startTime;
    const touched = start.touched || this.form.controls.attendees.touched;
    return errors && touched ? errors : [];
  }

  protected async submit(): Promise<void> {
    this.submitViolations.set([]);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const space = this.spacesStore.spaceById(Number(raw.spaceId));
    if (!space) return;

    const draft: ReservationDraft = {
      spaceId: space.id,
      date: raw.date,
      startTime: raw.startTime,
      endTime: raw.endTime,
      requester: raw.requester.trim(),
      attendees: Number(raw.attendees),
      purpose: raw.purpose,
    };

    this.submitting.set(true);
    try {
      const result = await this.reservationsStore.create(draft, space);
      if (result.valid) {
        await this.router.navigate(['/reservas']);
      } else {
        this.submitViolations.set(result.violations);
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
