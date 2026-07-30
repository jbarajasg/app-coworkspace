import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpacesStore } from '../../core/application/spaces.store';
import { StatusBadge } from '../../shared/ui/status-badge';
import { ReservationsStore } from '../../core/application/reservations.store';
import { Space, SpaceStatus } from '../../core/domain/models/space.model';
import { resolveSpaceStatus } from '../../core/domain/rules/space-status';

@Component({
  selector: 'app-spaces-page',
  imports: [RouterLink, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spaces-page.html',
})
export class SpacesPage {
  protected readonly store = inject(SpacesStore);
  protected readonly reservationsStore = inject(ReservationsStore);
  protected readonly skeletons = Array.from({ length: 6 });

  constructor() {
    void this.store.load();
  }

  protected liveStatus(space: Space): SpaceStatus {
    return resolveSpaceStatus(space, this.reservationsStore.reservations(), new Date());
  }
}
