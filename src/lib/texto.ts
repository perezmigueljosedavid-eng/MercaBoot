/** Utilidades para comparar texto en español sin fijarse en acentos ni en mayúsculas. */

/** "Limón" → "limon". */
export const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Palabras normalizadas (solo letras y números). */
export function palabras(s: string): string[] {
  return norm(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * ¿El texto contiene lo que se buscó? Cada palabra de la búsqueda debe aparecer al inicio de alguna palabra del texto.
 * Ejemplo: "poll ent" encuentra "Pollo entero"; "tortilla" no encuentra "Carnicería".
 */
export function coincideBusqueda(texto: string, busqueda: string): boolean {
  const buscadas = palabras(busqueda);
  if (!buscadas.length) return false;
  const delTexto = palabras(texto);
  return buscadas.every((b) => delTexto.some((t) => t.startsWith(b)));
}
