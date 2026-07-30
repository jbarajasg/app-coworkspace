/** Horario laboral: 08:00–20:00 (RN-02). Duración: 1h–6h (RN-03). */
export const BUSINESS_START_MINUTES = 8 * 60;
export const BUSINESS_END_MINUTES = 20 * 60;
export const MIN_DURATION_MINUTES = 60;
export const MAX_DURATION_MINUTES = 6 * 60;

export function timeToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function durationInMinutes(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

/**
 * Solapamiento con intervalos CERRADOS: el enunciado (RN-01) prohíbe
 * explícitamente una reserva de 12:00-14:00 si existe una de 10:00-12:00,
 * por lo que compartir el instante de borde cuenta como conflicto.
 * Nota: difiere de la convención semiabierta habitual; decisión documentada en el README.
 */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Construye el Date local de inicio de una reserva. */
export function toStartDate(date: string, startTime: string): Date {
  return new Date(`${date}T${startTime}:00`);
}
