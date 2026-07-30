import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/* prettier-ignore */
const STYLES: Record<string, { badge: string; dot: string }> = {
  'Disponible': { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  'Ocupado': { badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  'En mantenimiento': { badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
  'Confirmada': { badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20', dot: 'bg-indigo-500' },
  'Completada': { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  'Cancelada': { badge: 'bg-slate-100 text-slate-600 ring-slate-500/20', dot: 'bg-slate-400' },
  'Cancelada con penalización': { badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
};
const FALLBACK = { badge: 'bg-slate-100 text-slate-600 ring-slate-500/20', dot: 'bg-slate-400' };

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset"
      [class]="styles().badge"
    >
      <span class="size-1.5 rounded-full" [class]="styles().dot" aria-hidden="true"></span>
      {{ status() }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<string>();
  protected readonly styles = computed(() => STYLES[this.status()] ?? FALLBACK);
}
