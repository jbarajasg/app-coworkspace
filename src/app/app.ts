import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  protected readonly menuOpen = signal(false);
  protected readonly links = [
    { path: '/espacios', label: 'Espacios' },
    { path: '/reservas', label: 'Reservas' },
    { path: '/calendario', label: 'Calendario' },
    { path: '/reportes', label: 'Reportes' },
  ] as const;
}
