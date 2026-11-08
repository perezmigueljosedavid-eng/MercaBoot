/** Utilidades para entender texto en español: sin acentos, sin mayúsculas, con tolerancia a plurales y errores de dedo. */

export const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Palabras normalizadas (solo letras y números). La ñ se conserva como n. */
export function tokens(s: string): string[] {
  return norm(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Distancia de edición con corte anticipado. */
export function lev(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let minFila = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + costo);
      cur.push(v);
      if (v < minFila) minFila = v;
    }
    if (minFila > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Dos palabras son la misma si solo cambia el plural (chile/chiles, limón/limones). */
export function igual(a: string, b: string): boolean {
  return a === b || a + 's' === b || a + 'es' === b || b + 's' === a || b + 'es' === a;
}

/** ¿La palabra del texto corresponde a la palabra del diccionario? Permite 1 error en palabras largas (2 en muy largas) si empiezan igual. */
export function palabraCoincide(texto: string, dic: string, tolerar = true): 0 | 1 | 2 {
  if (igual(texto, dic)) return 2;
  if (!tolerar) return 0;
  const n = Math.min(texto.length, dic.length);
  if (n < 6 || texto[0] !== dic[0]) return 0;
  const max = n >= 11 ? 2 : 1;
  return lev(texto, dic, max) <= max ? 1 : 0;
}

/** Busca la frase (ya en palabras) dentro del texto. Devuelve la calidad de la coincidencia y dónde empieza, o null. */
export function encontrarFrase(texto: string[], frase: string[]): { calidad: number; desde: number } | null {
  if (!frase.length || texto.length < frase.length) return null;
  const tolerar = frase.length === 1;
  for (let i = 0; i + frase.length <= texto.length; i++) {
    let total = 0;
    let ok = true;
    for (let j = 0; j < frase.length; j++) {
      const c = palabraCoincide(texto[i + j], frase[j], tolerar);
      if (!c) {
        ok = false;
        break;
      }
      total += c;
    }
    if (ok) return { calidad: total, desde: i };
  }
  return null;
}

/** Calidad de la coincidencia de la frase en el texto, o 0 si no aparece. */
export function buscarFrase(texto: string[], frase: string[]): number {
  return encontrarFrase(texto, frase)?.calidad ?? 0;
}

export const capitalizar = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Elige un elemento de forma determinista a partir de una semilla (para variar las frases sin ser aleatorio). */
export function elegir<A>(lista: A[], semilla: number): A {
  return lista[Math.abs(Math.floor(semilla)) % lista.length];
}
