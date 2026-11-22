import { idsDeNombre } from './ingredientes';
import { R } from './recetaUtil';
import type { Receta } from './recetaUtil';
import { tokens } from './texto';

/**
 * Convierte la receta que escribió la IA (lo que devuelve la función «receta-ia») en una receta del asistente:
 * así se evalúa contra lo que hay en las tiendas igual que las recetas del equipo.
 *
 * Este archivo no usa nada de React Native, para poder probarlo solo.
 * Autor: José David Pérez Miguel
 */

export interface IngredienteIA {
  nombre: string;
  cantidad: string;
  principal: boolean;
  opcional: boolean;
}

/** La receta tal como la devuelve la función «receta-ia» (ya revisada ahí). */
export interface RecetaIAJson {
  nombre: string;
  sabores: string[];
  momentos: string[];
  minutos: number;
  porciones: number;
  ingredientes: IngredienteIA[];
  pasos: string[];
  consejo: string;
  aviso: string;
}

const SABOR: Record<string, string> = { dulce: 'D', salado: 'S', picante: 'P', acido: 'A', amargo: 'M' };
const MOMENTO: Record<string, string> = { desayuno: 'd', comida: 'c', cena: 'n', botana: 'b', postre: 'p', bebida: 'e' };

/** Cantidades que se leen bien con «de» («500 g de pollo», «1 taza de leche», «una pizca de sal»). */
const CON_UNIDAD =
  /^(?:\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|\d+\s+\d+\/\d+|un|una|uno|unos|unas|media|medio|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce)\s*(?:g|gr|grs|gramos?|kg|kilos?|ml|l|lt|litros?|tazas?|cucharadas?|cucharaditas?|cdas?|cdtas?|pizcas?|dientes?|hojas?|rebanadas?|rajas?|latas?|paquetes?|vasos?|trozos?|ramas?|ramitas?|piezas?|pu[nñ]ados?|bolsas?|barras?|tablillas?|cabezas?|manojos?|sobres?|tiras?|lonjas?|porciones?|chorritos?|chorros?|botes?|frascos?|cubos?|filetes?|tallos?)\b/i;

/** «500 g» + «pechuga de pollo» → «500 g de pechuga de pollo»; «al gusto» + «sal» → «sal al gusto». */
export function textoIngrediente(cantidad: string, nombre: string): string {
  const c = cantidad.trim();
  const n = nombre.trim();
  if (!c) return n;
  if (/^(?:al gusto|c\.?\s?s\.?|necesari[oa]s?|suficiente|un poco|poco|la necesaria|opcional)/i.test(c)) return `${n} ${c.toLowerCase()}`;
  if (/^\d+(?:[.,]\d+)?$/.test(c)) return `${c} ${Number(c.replace(',', '.')) === 1 ? 'pieza' : 'piezas'} de ${n}`;
  if (CON_UNIDAD.test(c)) return /\bde$/i.test(c) ? `${c} ${n}` : `${c} de ${n}`;
  return `${n} (${c})`;
}

/** Palabras de un nombre de producto que sirven para buscarlo por nombre en las tiendas. */
const DESCRIPTORES = new Set(
  (
    'fresco fresca frescos frescas picado picada picados picadas molido molida molidos molidas rallado rallada ralladas rallados cocido cocida cocidos cocidas ' +
    'grande grandes chico chica chicos chicas mediano mediana medianos medianas maduro madura maduros maduras entero entera enteros enteras en polvo ' +
    'sin con para tipo estilo natural suave fino fina gruesa grueso seco seca secos secas'
  ).split(' '),
);

function palabrasDeBusqueda(nombre: string): string[] {
  const p = tokens(nombre).filter((w) => w.length >= 4 && !DESCRIPTORES.has(w));
  return [...new Set(p)].slice(0, 3);
}

/** Un número corto y estable a partir de la petición, para el identificador de la receta. */
function hashCorto(texto: string): string {
  let h = 7;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

/**
 * Receta del asistente a partir de la que escribió la IA.
 * Cada ingrediente se liga al diccionario cuando se reconoce con seguridad; si no, se buscará por su nombre en las tiendas.
 */
export function recetaDesdeIA(json: RecetaIAJson, clave: string): Receta {
  const ing: [string, string, string, string | undefined][] = json.ingredientes.map((i) => {
    // Un solo ingrediente reconocido sirve; si el nombre mezcla dos («mantequilla de cacahuate») se busca por nombre completo
    const ids = [...new Set(idsDeNombre(i.nombre))];
    const unico = ids.length === 1 ? ids[0] : '';
    const banderas = `${i.principal && !i.opcional ? 'p' : ''}${i.opcional ? 'o' : ''}`;
    return [unico, textoIngrediente(i.cantidad, i.nombre), banderas, unico ? undefined : palabrasDeBusqueda(i.nombre).join('|') || undefined];
  });
  const sab = json.sabores.map((s) => SABOR[s]).filter(Boolean).join('') || 'S';
  const mom = json.momentos.map((m) => MOMENTO[m]).filter(Boolean).join('') || 'c';
  const base = R(`ia-${hashCorto(clave)}`, json.nombre, sab, mom, json.minutos, json.porciones, '', ing, json.pasos, json.consejo || undefined);
  return { ...base, ia: true, aviso: json.aviso || undefined };
}

/** ¿Lo que llegó parece una receta de la función? (para no fiarse de lo guardado en el teléfono) */
export function esRecetaIAJson(x: unknown): x is RecetaIAJson {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  const lista = (v: unknown) => Array.isArray(v);
  return (
    typeof r.nombre === 'string' &&
    r.nombre.length > 0 &&
    lista(r.sabores) &&
    lista(r.momentos) &&
    typeof r.minutos === 'number' &&
    typeof r.porciones === 'number' &&
    lista(r.ingredientes) &&
    (r.ingredientes as unknown[]).length >= 2 &&
    (r.ingredientes as unknown[]).every((i) => !!i && typeof i === 'object' && typeof (i as Record<string, unknown>).nombre === 'string') &&
    lista(r.pasos) &&
    (r.pasos as unknown[]).length >= 2 &&
    (r.pasos as unknown[]).every((p) => typeof p === 'string')
  );
}
