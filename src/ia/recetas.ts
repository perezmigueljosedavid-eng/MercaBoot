import { RECETAS_SALADAS } from './recetasSalados';
import { RECETAS_DULCES } from './recetasDulces';
import { RECETAS_EXTRA } from './recetasExtra';
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
  // 10 de mayo y 3er domingo de junio
  'enchiladas-verdes-pollo': ['madre'],
  'chiles-rellenos-quesillo': ['madre'],
  'costillas-salsa-roja': ['padre'],
  'bistec-encebollado': ['padre'],
  'tacos-bistec': ['padre'],
};

/** Todas las recetas que el asistente conoce. */
export const RECETAS: Receta[] = [...RECETAS_SALADAS, ...RECETAS_DULCES, ...RECETAS_EXTRA].map((r) => {
  const extra = FIESTAS_EXTRA[r.id];
  return extra ? { ...r, tags: [...new Set([...r.tags, ...extra])] } : r;
});

export const receta = (id: string) => RECETAS.find((r) => r.id === id);
