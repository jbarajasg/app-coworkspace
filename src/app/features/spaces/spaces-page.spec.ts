import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { SpaceRepository } from '../../core/application/ports';
import { FakeSpaceRepository, makeSpace, settle } from '../../testing/fakes';
import { SpacesPage } from './spaces-page';

describe('SpacesPage (integración)', () => {
  let spaceRepo: FakeSpaceRepository;

  beforeEach(() => {
    spaceRepo = new FakeSpaceRepository();
    TestBed.configureTestingModule({
      imports: [SpacesPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SpaceRepository, useValue: spaceRepo },
      ],
    });
  });

  it('renderiza las tarjetas con los espacios del repositorio', async () => {
    spaceRepo.seed = [makeSpace(), makeSpace({ id: 2, name: 'Sala Nebula' })];
    const fixture = TestBed.createComponent(SpacesPage);
    await settle(fixture);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Sala Aurora');
    expect(text).toContain('Sala Nebula');
  });

  it('un espacio en mantenimiento no ofrece el CTA de reservar', async () => {
    spaceRepo.seed = [makeSpace({ name: 'Espacio Open', status: 'En mantenimiento' })];
    const fixture = TestBed.createComponent(SpacesPage);
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('No disponible');
    expect(fixture.nativeElement.querySelector('a[href*="reservas/nueva"]')).toBeNull();
  });

  it('muestra el error de carga y el reintento recupera los datos', async () => {
    spaceRepo.failNext = true;
    const fixture = TestBed.createComponent(SpacesPage);
    await settle(fixture);

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();

    (alert.querySelector('button') as HTMLButtonElement).click();
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Sala Aurora');
  });
});
