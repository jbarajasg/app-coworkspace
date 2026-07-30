import { Injectable, computed, inject, signal } from '@angular/core';
import { Space } from '../domain/models/space.model';
import { SpaceRepository } from './ports';

@Injectable({ providedIn: 'root' })
export class SpacesStore {
  private readonly repository = inject(SpaceRepository);

  private readonly _spaces = signal<readonly Space[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly spaces = this._spaces.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly byId = computed(() => new Map(this._spaces().map((s) => [s.id, s])));

  spaceById(id: number): Space | undefined {
    return this.byId().get(id);
  }

  async load(): Promise<void> {
    if (this._spaces().length > 0) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      this._spaces.set(await this.repository.findAll());
    } catch {
      this._error.set('No se pudieron cargar los espacios. Intenta de nuevo.');
    } finally {
      this._loading.set(false);
    }
  }
}
