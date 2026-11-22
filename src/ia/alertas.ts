import { norm } from './texto';

/**
 * «Avísame cuando haya aguacate»: cómo se escribe lo que la persona espera y cuándo un producto es eso.
 * Es lo mismo que hace la base de datos (funciones _texto_simple y _alerta_coincide), para que la app y el servidor
 * estén de acuerdo. Sin dependencias de la app, para poder probarlo solo.
 * Autor: José David Pérez Miguel
 */

/** Solo letras, de 3 a 40 letras y hasta 4 palabras, sin acentos ni mayúsculas. `null` si no sirve. */
export function terminoDeAlerta(texto: string): string | null {
  const t = norm(texto)
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length < 3 || t.length > 40) return null;
  return /^[a-z]+( [a-z]+){0,3}$/.test(t) ? t : null;
}

const limpiar = (s: string) =>
  norm(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Las formas en que puede aparecer lo esperado dentro del nombre de un producto (singular y plural), ya con espacios a los lados. */
export function formasDeAlerta(termino: string): string[] {
  const t = limpiar(termino);
  if (!t) return [];
  const formas = new Set([t, `${t}s`, `${t}es`, t.replace(/s$/, ''), t.replace(/es$/, '')]);
  return [...formas].filter(Boolean).map((f) => ` ${f} `);
}

/** ¿El nombre contiene alguna de esas formas, como palabra completa? */
export function nombreCoincide(nombre: string, formas: string[]): boolean {
  if (!formas.length) return false;
  const hay = ` ${limpiar(nombre)} `;
  return formas.some((f) => hay.includes(f));
}

/** ¿El nombre del producto es lo que la persona espera? Palabra completa, con su plural: «huevos» sí es «Huevo blanco», «pan» no es «panela». */
export function alertaCoincide(nombre: string, termino: string): boolean {
  return nombreCoincide(nombre, formasDeAlerta(termino));
}

export interface AlertaCumplida<P> {
  termino: string;
  productos: P[];
}

/**
 * De lo que la persona espera, lo que ya hay: para cada cosa, los productos disponibles que son eso (máximo 20 por cosa).
 * Revisa el nombre de cada producto una sola vez, así que sirve aunque haya miles de productos.
 */
export function alertasCumplidas<P extends { nombre: string; disponible: boolean }>(productos: P[], terminos: string[]): AlertaCumplida<P>[] {
  const buscadas = terminos.map((termino) => ({ termino, formas: formasDeAlerta(termino), productos: [] as P[] })).filter((b) => b.formas.length > 0);
  if (!buscadas.length) return [];
  for (const p of productos) {
    if (!p.disponible) continue;
    const hay = ` ${limpiar(p.nombre)} `;
    for (const b of buscadas) {
      if (b.productos.length < 20 && b.formas.some((f) => hay.includes(f))) b.productos.push(p);
    }
  }
  return buscadas.filter((b) => b.productos.length > 0).map(({ termino, productos: ps }) => ({ termino, productos: ps }));
}
