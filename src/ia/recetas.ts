import { recetasCombinadas } from './generador';
import { RECETAS_SALADAS } from './recetasSalados';
import { RECETAS_DULCES } from './recetasDulces';
import { RECETAS_EXTRA } from './recetasExtra';
import { RECETAS_NUEVAS } from './recetasNuevas';
import type { Receta } from './recetaUtil';

export type { Receta, IngReceta, Momento } from './recetaUtil';

/**
 * Platillos que se asocian a fiestas además de los que ya traen su etiqueta: así «ideas para La Candelaria» o «para Reyes»
 * tienen de dónde escoger. Las etiquetas son las de data/festividades.
 */
const FIESTAS_EXTRA: Record<string, string[]> = {
  // 2 de febrero: tamales y atole
  'atole-masa': ['candelaria', 'reyes', 'navidad'],
  'chocolate-pan-yema': ['candelaria', 'navidad', 'amor'],
  enmoladas: ['candelaria', 'madre'],
  'pollo-mole': ['candelaria', 'navidad'],
  // 6 de enero y diciembre: chocolate, café y postres para compartir
  'cafe-de-olla': ['reyes', 'candelaria'],
  'flan-casero': ['navidad', 'amor'],
  'carlota-limon': ['navidad'],
  'arroz-con-leche': ['reyes'],
  // 14 de febrero
  'platanos-crema': ['amor'],
  brownies: ['amor'],
  'pastel-chocolate': ['amor', 'madre'],
  // 10 de mayo y 3er domingo de junio
  'enchiladas-verdes-pollo': ['madre'],
  'chiles-rellenos-quesillo': ['madre'],
  'costillas-salsa-roja': ['padre'],
  'bistec-encebollado': ['padre'],
  'tacos-bistec': ['padre'],
  'pastel-tres-leches': ['madre', 'padre', 'amor'],
  'pastel-vainilla': ['madre', 'padre'],
  'pay-limon': ['madre'],
  // 16 de septiembre
  'tamales-mole-pollo': ['independencia'],
  'tamales-rajas-queso': ['independencia'],
  'pico-gallo': ['independencia'],
  'tacos-pastor': ['independencia'],
  // niñas y niños
  'galletas-chispas': ['nino'],
  'galletas-mantequilla': ['nino'],
  'pollo-naranja': ['madre'],
  'pasta-alfredo': ['nino'],
  'sopa-tortilla': ['independencia'],
  // el día de muertos
  'calabaza-tacha': ['muertos'],
  'camotes-piloncillo': ['muertos'],
  // 12 de diciembre y posadas
  'tamales-dulces': ['navidad', 'guadalupe'],
  'empanadas-amarillo': ['oaxaca'],
  'coloradito-pollo': ['oaxaca'],
  'salsa-pasilla': ['oaxaca'],
};

const ESCRITAS: Receta[] = [...RECETAS_SALADAS, ...RECETAS_DULCES, ...RECETAS_EXTRA, ...RECETAS_NUEVAS];

/** Todas las recetas revisadas que el asistente conoce: las escritas a mano y las que se arman con alimento + salsa. */
export const RECETAS: Receta[] = [...ESCRITAS, ...recetasCombinadas(new Set(ESCRITAS.map((r) => r.id)))].map((r) => {
  const extra = FIESTAS_EXTRA[r.id];
  return extra ? { ...r, tags: [...new Set([...r.tags, ...extra])] } : r;
});

/* ───────── recetas escritas por la IA ───────── */

/**
 * Recetas que la IA escribió para una petición de la persona. Se guardan por la petición («galletas de naranja con cardamomo»)
 * para no volver a preguntar; no entran a las recomendaciones generales porque el equipo no las ha revisado.
 */
const DE_IA = new Map<string, Receta>();
/** Cuántas se guardan: las más viejas se olvidan. */
const MAXIMO_IA = 60;
let TODAS: Receta[] | null = null;

export function registrarRecetaIA(clave: string, r: Receta): void {
  DE_IA.delete(clave);
  DE_IA.set(clave, r);
  while (DE_IA.size > MAXIMO_IA) {
    const primera = DE_IA.keys().next();
    if (primera.done) break;
    DE_IA.delete(primera.value);
  }
  TODAS = null;
}

export const recetaIAPorClave = (clave: string): Receta | undefined => DE_IA.get(clave);

/** Las recetas escritas por la IA que se guardaron (para conservarlas en el teléfono). */
export const recetasIAGuardadas = (): [clave: string, receta: Receta][] => [...DE_IA.entries()];

/** Las revisadas y las que escribió la IA. */
export function todasLasRecetas(): Receta[] {
  return (TODAS ??= [...RECETAS, ...DE_IA.values()]);
}

export const receta = (id: string): Receta | undefined => RECETAS.find((r) => r.id === id) ?? [...DE_IA.values()].find((r) => r.id === id);
