import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { ReservationRepository, SpaceRepository } from './core/application/ports';
import {
  InMemorySpaceRepository,
  InMemoryReservationRepository,
} from './core/infrastructure/in-memory.repositories';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: SpaceRepository, useClass: InMemorySpaceRepository },
    { provide: ReservationRepository, useClass: InMemoryReservationRepository },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ],
};
