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
      import('./features/reservations/reservations-page/reservations-page').then(
        (m) => m.ReservationsPage,
      ),
    title: 'Reservas | CoworkSpace',
  },
  {
    path: 'reservas/nueva',
    loadComponent: () =>
      import('./features/reservations/reservation-form-page/reservation-form-page').then(
        (m) => m.ReservationFormPage,
      ),
    title: 'Nueva reserva | CoworkSpace',
  },
  {
    path: 'calendario',
    loadComponent: () =>
      import('./features/calendar/calendar-page/calendar-page').then((m) => m.CalendarPage),
    title: 'Calendario | CoworkSpace',
  },
  {
    path: 'reportes',
    loadComponent: () =>
      import('./features/reports/reports-page/reports-page').then((m) => m.ReportsPage),
    title: 'Reportes | CoworkSpace',
  },
  { path: '**', redirectTo: 'espacios' },
];
