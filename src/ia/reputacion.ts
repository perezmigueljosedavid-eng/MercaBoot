import type { Resena } from '../data/tipos';

/**
 * Reputación de un negocio a partir de sus reseñas.
 * `bayes` es un promedio prudente: con pocas reseñas se acerca a 4.0 y con muchas se acerca al promedio real.
 * Así una tienda con una sola reseña de 5 estrellas no le gana a una con 30 reseñas de 4.7,
 * y una tienda nueva sin reseñas queda en el centro, sin ventaja ni castigo.
 */
export interface Reputacion {
  /** Promedio simple de estrellas con un decimal, o null si no tiene reseñas. */
  promedio: number | null;
  total: number;
  bayes: number;
}

export const PROMEDIO_BASE = 4.0;
export const PESO_BASE = 3;

export const SIN_RESENAS: Reputacion = { promedio: null, total: 0, bayes: PROMEDIO_BASE };

export function reputacionDe(estrellas: number[]): Reputacion {
  if (!estrellas.length) return SIN_RESENAS;
  const suma = estrellas.reduce((a, x) => a + x, 0);
  return {
    promedio: Math.round((suma / estrellas.length) * 10) / 10,
    total: estrellas.length,
    bayes: (PROMEDIO_BASE * PESO_BASE + suma) / (PESO_BASE + estrellas.length),
  };
}

/** Reputación de cada negocio que tiene reseñas. */
export function reputaciones(resenas: Pick<Resena, 'negocioId' | 'estrellas'>[]): Map<string, Reputacion> {
  const porNegocio = new Map<string, number[]>();
  for (const r of resenas) {
    const l = porNegocio.get(r.negocioId);
    if (l) l.push(r.estrellas);
    else porNegocio.set(r.negocioId, [r.estrellas]);
  }
  return new Map([...porNegocio].map(([id, l]) => [id, reputacionDe(l)]));
}

/** "★ 4.8 (12 reseñas)" o "Sin reseñas" */
export function textoReputacion(r: Reputacion): string {
  if (r.promedio == null) return 'Sin reseñas';
  return `★ ${r.promedio.toFixed(1)} (${r.total} ${r.total === 1 ? 'reseña' : 'reseñas'})`;
}
