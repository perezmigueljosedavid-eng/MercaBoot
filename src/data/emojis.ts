import { clasificar } from '../ia/ingredientes';
import { palabras } from '../lib/texto';
import type { CategoriaProducto } from './tipos';

/**
 * Dibujito (emoji) de cada producto para cuando no tiene foto. Así una tienda con cientos de productos se ve bien
 * sin que el comerciante tenga que subir una foto de cada uno. Se deduce del ingrediente que reconoció el asistente
 * o, si no, de las palabras del nombre y, al final, de la categoría.
 * Autor: José David Pérez Miguel
 */

/** Por ingrediente reconocido (ids de src/ia/ingredientes.ts). */
const POR_INGREDIENTE: Record<string, string> = {
  pollo: '🍗', res: '🥩', cerdo: '🥓', tasajo: '🥩', chorizo: '🌭', jamon: '🍖', salchicha: '🌭', tocino: '🥓', chicharron: '🥓',
  pescado: '🐟', camaron: '🦐', atun: '🥫', huevo: '🥚',
  quesillo: '🧀', queso: '🧀', crema: '🥛', leche: '🥛', leche_condensada: '🥛', mantequilla: '🧈', requeson: '🧀', yogurt: '🥛', nata: '🥛', queso_crema: '🧀',
  tortilla: '🫓', tortilla_harina: '🫓', tostada: '🫓', tlayuda: '🫓', memela: '🫓', sope: '🫓', masa: '🫓',
  pan_yema: '🍞', pan_dulce: '🥐', bolillo: '🥖', pan_caja: '🍞', pan: '🍞',
  jitomate: '🍅', tomate_verde: '🍅', cebolla: '🧅', ajo: '🧄', cilantro: '🌿', hierbas: '🌿', limon: '🍋', aguacate: '🥑', lechuga: '🥬', papa: '🥔',
  zanahoria: '🥕', calabacita: '🥒', calabaza: '🎃', elote: '🌽', nopal: '🌵', chayote: '🥒', ejote: '🫛', pepino: '🥒', flor_calabaza: '🌼',
  verdolaga: '🥬', champinon: '🍄', brocoli: '🥦', camote: '🍠', hoja_tamal: '🌽', chile_fresco: '🌶️',
  platano: '🍌', platano_macho: '🍌', manzana: '🍎', naranja: '🍊', pina: '🍍', mango: '🥭', papaya: '🍈', melon: '🍉', fruta: '🍓', jicama: '🥔', coco: '🥥', cana: '🎋',
  arroz: '🍚', frijol: '🫘', lenteja: '🫘', maiz_pozolero: '🌽', pasta: '🍝', avena: '🥣', harina: '🌾', hotcakes: '🥞', pan_molido: '🍞', azucar: '🍬',
  piloncillo: '🍯', canela: '🌿', chocolate: '🍫', miel: '🍯', cajeta: '🍯', mermelada: '🍓', cacahuate: '🥜', pasas: '🍇', ajonjoli: '🌾',
  galleta: '🍪', gelatina: '🍮', flan: '🍮', dulce: '🍬', helado: '🍨', aceite: '🫒', manteca: '🧈', sal: '🧂', especias: '🧂', caldo_polvo: '🧂',
  mayonesa: '🥫', salsa: '🌶️', chile_polvo: '🌶️', chamoy: '🌶️', chile_seco: '🌶️', chipotle: '🌶️', mole: '🥘', pure_tomate: '🍅', jamaica: '🌺', tamarindo: '🥤',
  cafe: '☕', vainilla: '🌿', leche_evaporada: '🥛', polvo_hornear: '🥄', levadura: '🥄', catsup: '🥫', vinagre: '🍶',
  refresco: '🥤', agua_fresca: '🥤', agua: '💧', alcohol: '🍺',
  tamal: '🫔', tamal_dulce: '🫔', antojito: '🌮', comida_hecha: '🍽️', postre: '🍰', fruta_preparada: '🍓', desayuno: '🍳', guisado: '🍲',
};

/** Palabras del nombre que dicen más que la categoría (para lo que el asistente no reconoce). */
const POR_PALABRA: [RegExp, string][] = [
  [/\b(pizza)\b/, '🍕'], [/\b(hamburguesa|hamburguesas)\b/, '🍔'], [/\b(torta|tortas|sandwich|cemita|cemitas|pambazo)\b/, '🥪'],
  [/\b(taco|tacos|quesadilla|quesadillas)\b/, '🌮'], [/\b(pastel|pasteles|cupcake|cupcakes|pay|brownie)\b/, '🍰'],
  [/\b(sopa|caldo|pozole|menudo|consome)\b/, '🍲'], [/\b(cafe|capuchino|latte|espresso)\b/, '☕'],
  [/\b(cerveza|cervezas|chela|chelas)\b/, '🍺'], [/\b(vino|vinos)\b/, '🍷'], [/\b(jugo|jugos|licuado|licuados|agua|aguas)\b/, '🥤'],
  [/\b(pan|panes)\b/, '🍞'], [/\b(galleta|galletas)\b/, '🍪'], [/\b(dona|donas)\b/, '🍩'], [/\b(helado|helados|nieve|nieves|paleta|paletas)\b/, '🍨'],
  [/\b(papas|papitas|frituras|botana|botanas|sabritas)\b/, '🥔'], [/\b(cacahuate|cacahuates|nuez|nueces|almendra|almendras)\b/, '🥜'],
  [/\b(jabon|detergente|cloro|suavizante)\b/, '🧼'], [/\b(papel|servilletas|servilleta)\b/, '🧻'], [/\b(pila|pilas|foco|focos)\b/, '🔋'],
  [/\b(cuaderno|cuadernos|lapiz|lapices|pluma|plumas|libreta)\b/, '📓'], [/\b(refresco|refrescos|coca|pepsi|sprite|fanta)\b/, '🥤'],
  [/\b(pollo|pechuga|pierna|muslo)\b/, '🍗'], [/\b(res|bistec|arrachera|carne)\b/, '🥩'], [/\b(pescado|mojarra|tilapia)\b/, '🐟'],
  [/\b(huevo|huevos)\b/, '🥚'], [/\b(leche)\b/, '🥛'], [/\b(queso|quesillo)\b/, '🧀'], [/\b(tortilla|tortillas)\b/, '🫓'],
  [/\b(fresa|fresas)\b/, '🍓'], [/\b(uva|uvas)\b/, '🍇'], [/\b(sandia|melon)\b/, '🍉'], [/\b(limon|limones)\b/, '🍋'], [/\b(pera|peras)\b/, '🍐'],
  [/\b(durazno|duraznos)\b/, '🍑'], [/\b(cereza|cerezas)\b/, '🍒'], [/\b(kiwi)\b/, '🥝'], [/\b(tomate|jitomate)\b/, '🍅'], [/\b(chile|chiles)\b/, '🌶️'],
  [/\b(maiz|elote|elotes)\b/, '🌽'], [/\b(zanahoria|zanahorias)\b/, '🥕'], [/\b(ajo)\b/, '🧄'], [/\b(cebolla|cebollas)\b/, '🧅'],
];

/** Por categoría, cuando no hay nada más específico. */
export const EMOJI_CATEGORIA: Record<CategoriaProducto, string> = {
  carne: '🥩', ave: '🍗', pescado: '🐟', lacteo: '🥛', masa: '🫓', pan: '🍞', verdura: '🥬', fruta: '🍎',
  despensa: '🥫', dulce: '🍬', bebida: '🥤', preparado: '🍽️', otro: '🛒',
};

const memoria = new Map<string, string>();

/** El dibujito de un producto. */
export function emojiDeProducto(nombre: string, categoria: CategoriaProducto, ingrediente?: string): string {
  const clave = `${nombre}|${categoria}|${ingrediente ?? ''}`;
  const guardado = memoria.get(clave);
  if (guardado) return guardado;
  let e = ingrediente ? POR_INGREDIENTE[ingrediente] : undefined;
  if (!e) {
    const texto = palabras(nombre).join(' ');
    e = POR_PALABRA.find(([re]) => re.test(texto))?.[1];
  }
  if (!e) {
    const id = clasificar(nombre).ingrediente;
    e = id ? POR_INGREDIENTE[id] : undefined;
  }
  e ??= EMOJI_CATEGORIA[categoria] ?? EMOJI_CATEGORIA.otro;
  if (memoria.size > 4000) memoria.clear();
  memoria.set(clave, e);
  return e;
}
