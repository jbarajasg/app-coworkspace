import { Reservation } from '../domain/models/reservation.model';
import { Space } from '../domain/models/space.model';

export const SEED_SPACES: readonly Space[] = [
  {
    id: 1,
    name: 'Sala Aurora',
    type: 'Sala de reuniones',
    capacity: 6,
    pricePerHour: 25,
    features: ['WiFi', 'Proyector'],
    status: 'Disponible',
  },
  {
    id: 2,
    name: 'Sala Nebula',
    type: 'Sala de conferencias',
    capacity: 20,
    pricePerHour: 75,
    features: ['WiFi', 'Videoconferencia', 'Pizarra'],
    status: 'Disponible',
  },
  {
    id: 3,
    name: 'Hub Creativo',
    type: 'Oficina privada',
    capacity: 4,
    pricePerHour: 40,
    features: ['WiFi', 'Pizarra'],
    status: 'Disponible',
  },
  {
    id: 4,
    name: 'Espacio Open',
    type: 'Escritorio compartido',
    capacity: 1,
    pricePerHour: 10,
    features: ['WiFi'],
    status: 'En mantenimiento',
  },
  {
    id: 5,
    name: 'Sala Zen',
    type: 'Sala de reuniones',
    capacity: 8,
    pricePerHour: 35,
    features: ['WiFi', 'Proyector', 'Pizarra'],
    status: 'Disponible',
  },
];

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export const SEED_RESERVATIONS: readonly Reservation[] = [
  {
    id: 1,
    spaceId: 1,
    date: '2026-06-15',
    startTime: '10:00',
    endTime: '12:00',
    requester: 'María López',
    attendees: 4,
    purpose: 'Reunión',
    status: 'Confirmada',
  },
  {
    id: 2,
    spaceId: 2,
    date: '2026-06-15',
    startTime: '14:00',
    endTime: '17:00',
    requester: 'Carlos Ruiz',
    attendees: 15,
    purpose: 'Capacitación',
    status: 'Confirmada',
  },
  {
    id: 3,
    spaceId: 3,
    date: '2026-06-16',
    startTime: '09:00',
    endTime: '11:00',
    requester: 'Ana Torres',
    attendees: 3,
    purpose: 'Trabajo individual',
    status: 'Confirmada',
  },
  {
    id: 4,
    spaceId: 1,
    date: daysFromToday(0),
    startTime: '09:00',
    endTime: '11:00',
    requester: 'Laura Méndez',
    attendees: 5,
    purpose: 'Reunión',
    status: 'Confirmada',
  },
  {
    id: 5,
    spaceId: 2,
    date: daysFromToday(0),
    startTime: '15:00',
    endTime: '18:00',
    requester: 'Pedro Sanz',
    attendees: 12,
    purpose: 'Capacitación',
    status: 'Confirmada',
  },
  {
    id: 6,
    spaceId: 1,
    date: daysFromToday(1),
    startTime: '08:00',
    endTime: '10:00',
    requester: 'Sofía Vega',
    attendees: 6,
    purpose: 'Reunión',
    status: 'Confirmada',
  },
  {
    id: 7,
    spaceId: 5,
    date: daysFromToday(1),
    startTime: '10:00',
    endTime: '13:00',
    requester: 'Diego Ramos',
    attendees: 8,
    purpose: 'Evento',
    status: 'Confirmada',
  },
  {
    id: 8,
    spaceId: 2,
    date: daysFromToday(3),
    startTime: '14:00',
    endTime: '19:00',
    requester: 'Elena Gil',
    attendees: 18,
    purpose: 'Evento',
    status: 'Confirmada',
  },
  {
    id: 9,
    spaceId: 5,
    date: daysFromToday(-1),
    startTime: '09:00',
    endTime: '12:00',
    requester: 'Marta Ortiz',
    attendees: 6,
    purpose: 'Capacitación',
    status: 'Completada',
  },
  {
    id: 10,
    spaceId: 3,
    date: daysFromToday(-2),
    startTime: '16:00',
    endTime: '18:00',
    requester: 'Iván Peña',
    attendees: 2,
    purpose: 'Reunión',
    status: 'Cancelada con penalización',
  },
];
