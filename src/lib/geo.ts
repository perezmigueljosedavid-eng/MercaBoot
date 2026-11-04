import { Linking } from 'react-native';
import { COMUNIDAD } from '../data/contenido';
import type { Coord, Negocio } from '../data/tipos';
import { coordDe } from './distancia';

export { distanciaM, coordDe, distanciaA, textoDistancia, etiquetaDistancia } from './distancia';

export function textoCoord(c: Coord): string {
  return `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
}

/** Enlace para llegar al negocio: con coordenadas si las hay, si no su enlace de Maps o una búsqueda por nombre. */
type DatosMapa = Pick<Negocio, 'nombre' | 'direccion' | 'lat' | 'lng' | 'mapsUrl'>;

export function enlaceMapas(n: DatosMapa): string {
  const c = coordDe(n);
  if (c) return `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
  if (n.mapsUrl) return n.mapsUrl;
  const q = [n.nombre, n.direccion, COMUNIDAD].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function abrirMapas(n: DatosMapa) {
  Linking.openURL(enlaceMapas(n)).catch(() => {});
}

export function abrirTelefono(tel: string) {
  Linking.openURL(`tel:${tel.replace(/[^\d+]/g, '')}`).catch(() => {});
}

/* ───────── leer coordenadas de un enlace de Google Maps o de texto ───────── */

const valida = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

const PATRONES: RegExp[] = [
  /@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,
  /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
  /[?&](?:q|query|ll|destination|center|daddr)=(-?\d{1,3}\.\d+)(?:,|%2C|%2c)\s*(-?\d{1,3}\.\d+)/,
  /^\s*(-?\d{1,3}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)\s*$/,
];

/** Busca coordenadas dentro de un texto: "17.03, -96.73", o un enlace de Google Maps completo. */
export function extraerCoordenadas(texto: string): Coord | null {
  if (!texto) return null;
  let t = texto;
  try {
    t = decodeURIComponent(texto);
  } catch {
    /* se usa el texto tal cual */
  }
  for (const re of PATRONES) {
    const m = re.exec(t) ?? re.exec(texto);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (valida(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

/**
 * Intenta obtener las coordenadas de lo que pegó el usuario. Si es un enlace corto de Google Maps
 * lo abre para seguir la redirección (solo funciona con internet y en el teléfono, no en el navegador).
 */
export async function resolverEnlaceMapas(texto: string): Promise<Coord | null> {
  const directo = extraerCoordenadas(texto);
  if (directo) return directo;
  const url = /https?:\/\/\S+/.exec(texto)?.[0];
  if (!url) return null;
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = setTimeout(() => ctl?.abort(), 9000);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctl?.signal });
    const dePagina = extraerCoordenadas(res.url ?? '');
    if (dePagina) return dePagina;
    const cuerpo = (await res.text()).slice(0, 400000);
    return extraerCoordenadas(cuerpo);
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
