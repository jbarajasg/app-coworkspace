import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'espacios' },
  {
    path: 'espacios',
    loadComponent: () => import('./features/spaces/spaces-page').then((m) => m.SpacesPage),
    title: 'Espacios | CoworkSpace',
  },
  {
    path: 'reservas',
    loadComponent: () =>
      import('./features/reservations/reservations-page').then((m) => m.ReservationsPage),
    title: 'Reservas | CoworkSpace',
  },
  { path: '**', redirectTo: 'espacios' },
];
