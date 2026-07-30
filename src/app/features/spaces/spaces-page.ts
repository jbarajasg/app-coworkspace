import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpacesStore } from '../../core/application/spaces.store';
import { StatusBadge } from '../../shared/ui/status-badge';

@Component({
  selector: 'app-spaces-page',
  imports: [RouterLink, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spaces-page.html',
})
export class SpacesPage {
  protected readonly store = inject(SpacesStore);
  protected readonly skeletons = Array.from({ length: 6 });

  constructor() {
    void this.store.load();
  }
}
