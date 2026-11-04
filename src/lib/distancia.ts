import type { Coord, Negocio } from '../data/tipos';

/** Cálculos de distancia sin dependencias de React Native (también los usa el asistente). */

const RADIO_TIERRA_M = 6371000;
const rad = (g: number) => (g * Math.PI) / 180;

/** Distancia en metros entre dos puntos (fórmula de Haversine). */
export function distanciaM(a: Coord, b: Coord): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function coordDe(n: Pick<Negocio, 'lat' | 'lng'>): Coord | null {
  return typeof n.lat === 'number' && typeof n.lng === 'number' ? { lat: n.lat, lng: n.lng } : null;
}

/** Distancia desde el usuario hasta el negocio, o null si falta alguna ubicación. */
export function distanciaA(n: Pick<Negocio, 'lat' | 'lng'>, origen: Coord | null | undefined): number | null {
  const c = coordDe(n);
  if (!c || !origen) return null;
  return distanciaM(origen, c);
}

export function textoDistancia(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

/** "a 350 m · 4 min a pie" (a pie solo si queda cerca). */
export function etiquetaDistancia(m: number | null | undefined): string | null {
  if (m == null) return null;
  if (m <= 2500) return `a ${textoDistancia(m)} · ${Math.max(1, Math.round(m / 80))} min a pie`;
  return `a ${textoDistancia(m)}`;
}
