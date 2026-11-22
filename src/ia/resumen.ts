import { alertasCumplidas, formasDeAlerta, nombreCoincide } from './alertas';

/**
 * «Resumen del día» del comerciante: lo que conviene atender, sacado de lo que ya sabe la app. Sin dependencias de la app, para poder probarlo solo.
 * Autor: José David Pérez Miguel
 */

interface ProductoMinimo {
  id: string;
  negocioId: string;
  nombre: string;
  disponible: boolean;
  actualizado: number;
}

export interface Demanda {
  /** Lo que buscaron (sin acentos). */
  termino: string;
  /** Cuántas veces en la semana. */
  veces: number;
  /** Un producto de este negocio que se llama así pero está agotado (si lo hay): basta con marcar que ya hay. */
  mio?: { id: string; nombre: string };
}

/**
 * «Lo que buscaron y nadie tiene»: de lo más buscado sin resultado esta semana, lo que todavía ninguna tienda tiene disponible
 * (si alguna tienda ya lo tiene, ya no hace falta). Si el negocio lo tiene pero agotado, se le dice cuál es.
 */
export function demandaSinAtender(busquedas: { termino: string; veces: number }[], productos: ProductoMinimo[], negocioId: string, max = 3): Demanda[] {
  if (!busquedas.length) return [];
  const ocupadas = new Set(alertasCumplidas(productos, busquedas.map((b) => b.termino)).map((c) => c.termino));
  const agotadosMios = productos.filter((p) => p.negocioId === negocioId && !p.disponible);
  const res: Demanda[] = [];
  for (const b of busquedas) {
    if (ocupadas.has(b.termino)) continue;
    const formas = formasDeAlerta(b.termino);
    const mio = agotadosMios.find((p) => nombreCoincide(p.nombre, formas));
    res.push({ termino: b.termino, veces: b.veces, ...(mio ? { mio: { id: mio.id, nombre: mio.nombre } } : {}) });
    if (res.length >= max) break;
  }
  return res;
}

const DIA_MS = 86_400_000;

/** Cuántos productos disponibles de este negocio llevan más de `dias` días sin tocarse (puede que ya hayan cambiado de precio o se hayan acabado). */
export function productosSinRevisar(productos: ProductoMinimo[], negocioId: string, ahora: number, dias = 7): number {
  const limite = ahora - dias * DIA_MS;
  let n = 0;
  for (const p of productos) if (p.negocioId === negocioId && p.disponible && p.actualizado < limite) n += 1;
  return n;
}
