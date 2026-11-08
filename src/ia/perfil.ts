import type { CategoriaProducto, Etiqueta, Momento, Sabor, TipoProducto } from '../data/tipos';
import { grupoDeGiro } from '../data/giros';
import { norm } from './texto';

/**
 * Deduce, a partir del nombre de un producto, para qué sirve: cuándo se come, si lleva carne,
 * si tiene proteína y si se sirve caliente. El comerciante no tiene que llenar nada de esto;
 * solo corrige lo que la app entendió mal.
 */

/** Palabras (sin acentos) que indican carne, pollo o pescado. */
const CARNE =
  /\b(pollo|pechuga|pierna|muslo|alitas?|res|bistec|bisteck|bistek|arrachera|cecina|tasajo|suadero|pastor|carnitas?|barbacoa|birria|cerdo|puerco|chuletas?|costillas?|costillitas?|chorizo|longaniza|jamon|tocino|salchichas?|chicharron(?:es)?|pancita|menudo|tripas?|cabrito|borrego|pavo|pescado|mojarra|tilapia|huachinango|camarones?|mariscos?|atun|sardinas?|carnes?|milanesas?|albondigas|picadillo|machaca|cochinita|pozole|mixiotes?|cueritos|hamburguesas?|hot ?dogs?|alambres?|pata|retazo|lengua|higado|filete|gallina|mole con pollo|chileatole con pollo)\b/;

const SIN_CARNE_EXPLICITO = /\b(sin carne|sin pollo|sin carnes|vegetarian[oa]s?|vegan[oa]s?|veggie|de hongos|de setas|de champinones|de nopales?|de rajas|de flor de calabaza)\b/;

/** Rellenos y platillos que no llevan carne. */
const VEGETAL = /\b(de rajas|rajas|de flor de calabaza|de nopales?|nopales|de hongos|hongos|champinones|de papa|de elote|de frijol|frijoles|de queso|de quesillo|de verduras|verduras|de calabaza|de huitlacoche|huitlacoche|de espinacas?|ensalada|de aguacate|guacamole|de lentejas?|de garbanzos?)\b/;

const PROTEINA_NO_CARNE = /\b(queso|quesillo|requeson|huevos?|frijoles?|lentejas?|garbanzos?|habas?|nueces|nuez|almendras?|cacahuates?|soya|tofu|yogurt|yogur|panela)\b/;

const FRIO = /\b(helados?|nieves?|paletas?|raspados?|frio|fria|frappe|licuados?|aguas?|jugos?|limonadas?|naranjadas?|gelatinas?|ensaladas?|ceviche|coctel|fruta|frutas|fresas|mangonada|chamoyada|horchata|jamaica|refrescos?|malteadas?|smoothies?)\b/;

const CALIENTE =
  /\b(caldo|sopa|pozole|menudo|birria|barbacoa|atole|champurrado|cafe|capuchino|latte|ponche|mole|tamal(?:es)?|enchiladas?|enmoladas|entomatadas|chilaquiles|huevos?|hot ?cakes?|comida corrida|guisados?|asados?|asadas?|fritos?|fritas?|rostizado|rostizada|pollo|tlayudas?|memelas?|quesadillas?|tacos?|tortas?|pizzas?|hamburguesas?|alambres?|crema de|consome|chocolate caliente|te de|carnitas|costillas|milanesas?|bistec|empanadas?|gorditas?|sopes?|molotes?|elotes?)\b/;

const MOMENTOS: [RegExp, Momento[]][] = [
  [/\b(desayunos?|huevos?|chilaquiles|molletes?|hot ?cakes?|omelet|omelette|machaca|avena|cereal|granola|pan con chocolate|licuados?|atole|champurrado|cafe|capuchino|latte|enfrijoladas|tamal(?:es)?|pan de yema|pan de nata)\b/, ['desayuno']],
  [/\b(comida corrida|menu del dia|comida del dia|guisados?|plato fuerte|platillo|caldo|pozole|menudo|birria|barbacoa|mole|estofado|mixiotes?|chiles? rellenos?|arroz(?! con leche)|sopa|crema de|pollo|milanesas?|bistec|costillas?|chuletas?|carnitas|pescado|mojarra|camarones?|ceviche|arrachera|cecina|tasajo|alambres?|picadillo|albondigas|pasta|spaghetti|espagueti|lasa[nñ]a|comida|cochinita|segueza|chileatole|amarillo|coloradito|tlayudas?|rostizado|parrillada)\b/, ['comida']],
  [/\b(cenas?|tacos?|tortas?|quesadillas?|tlayudas?|memelas?|sopes?|gorditas?|empanadas?|tostadas?|enchiladas?|enmoladas|entomatadas|tamal(?:es)?|pizzas?|hamburguesas?|hot ?dogs?|sandwich|sincronizadas?|molotes?|garnachas?|flautas|taquitos|pambazos?|cemitas?|nachos)\b/, ['cena', 'botana']],
  [/\b(botanas?|esquites?|elotes?|papas|papitas|churros?|palomitas|cacahuates|chicharrones?|fruta|frutas|fresas|mangonada|chamoyada|jicama|pepino|dulces?|cocadas?|obleas?|alegrias?|palanquetas?)\b/, ['botana']],
  [/\b(postres?|pastel|pasteles|pay|pays|flan|flanes|gelatinas?|helados?|nieves?|paletas?|raspados?|crepas?|waffles?|brownies?|cheesecake|tres leches|arroz con leche|capirotada|bunuelos?|natillas?|mousse|trufas?|cupcakes?|fresas con crema|nicuatole|cocadas?|dulce de|calabaza en tacha|camotes? en dulce|pan de muerto|rosca|donas?|churros?)\b/, ['postre']],
  [/\b(bebidas?|aguas?|jugos?|licuados?|refrescos?|limonadas?|naranjadas?|horchata|jamaica|tejate|tepache|atole|champurrado|cafe|capuchino|latte|te|chocolate caliente|chocolate de agua|chocolate de leche|ponche|malteadas?|smoothies?|raspados?)\b/, ['bebida']],
];

const POR_GIRO: Record<ReturnType<typeof grupoDeGiro>, Momento[]> = {
  preparados: ['comida'],
  postres: ['postre'],
  bebidas: ['bebida'],
  frescos: [],
  otros: [],
};

const POR_CATEGORIA: Partial<Record<CategoriaProducto, Momento[]>> = {
  bebida: ['bebida'],
  dulce: ['postre'],
  pan: ['desayuno', 'cena'],
  fruta: ['botana'],
  preparado: ['comida'],
};

const LISTA_SABORES: string[] = ['dulce', 'salado', 'picante', 'acido', 'amargo'];
export const esSabor = (e: Etiqueta): e is Sabor => LISTA_SABORES.includes(e);

export interface DatosBase {
  cat: CategoriaProducto;
  sabores: Sabor[];
  /** Id del ingrediente del diccionario, si lo hubo. */
  id?: string;
}

function dietaDe(texto: string, base: DatosBase, tipo: TipoProducto): Etiqueta[] {
  const sin = SIN_CARNE_EXPLICITO.test(texto);
  const proteinaVeg = PROTEINA_NO_CARNE.test(texto);
  if (sin) return proteinaVeg ? ['sinCarne', 'proteina'] : ['sinCarne'];
  if (CARNE.test(texto) || ['carne', 'ave', 'pescado'].includes(base.cat)) return ['carne', 'proteina'];
  if (proteinaVeg || base.cat === 'lacteo' || base.id === 'frijol' || base.id === 'lenteja') return ['sinCarne', 'proteina'];
  if (VEGETAL.test(texto)) return ['sinCarne'];
  const sinCarneSeguro = tipo === 'preparado' ? ['dulce', 'pan', 'bebida', 'fruta'] : ['dulce', 'pan', 'bebida', 'fruta', 'verdura', 'masa'];
  if (sinCarneSeguro.includes(base.cat) || (tipo === 'preparado' && base.sabores.includes('dulce'))) return ['sinCarne'];
  return [];
}

function momentosDe(texto: string, base: DatosBase, giro?: string): Momento[] {
  const res = new Set<Momento>();
  for (const [re, ms] of MOMENTOS) if (re.test(texto)) ms.forEach((m) => res.add(m));
  if (res.size) return [...res];
  const porCat = POR_CATEGORIA[base.cat];
  if (porCat) return porCat;
  return POR_GIRO[grupoDeGiro(giro)];
}

/**
 * Características que deduce la app para un producto.
 * Los ingredientes para cocinar solo llevan sabor y qué lleva; los platillos ya hechos llevan también momento y temperatura.
 */
/** Panes y pasteles que se comen como postre aunque lleven elote, nata o calabaza. */
const POSTRE_DULCE = /\b(pan de (?:elote|nata|yema|muerto|platano|calabaza|naranja|zanahoria)|pastel(?:es)?|pays?|panques?|mantecadas?|rosca|donas?|brownies?|cheesecake|galletas?|cupcakes?|muffins?|tartas?)\b/;

export function perfilDe(nombre: string, base: DatosBase, tipo: TipoProducto, giro?: string): Etiqueta[] {
  const texto = norm(nombre).replace(/[^a-z0-9\s]/g, ' ');
  let res: Etiqueta[] = [...base.sabores];
  res.push(...dietaDe(texto, base, tipo));
  if (tipo === 'preparado') {
    let momentos = momentosDe(texto, base, giro);
    let caliente = CALIENTE.test(texto) && !FRIO.test(texto);
    if (POSTRE_DULCE.test(texto) && !CARNE.test(texto)) {
      res = res.filter((e) => e !== 'salado');
      if (!res.includes('dulce')) res.push('dulce');
      momentos = ['postre', ...momentos.filter((m) => m === 'desayuno' || m === 'bebida')];
      caliente = false;
    }
    res.push(...momentos);
    if (caliente) res.push('caliente');
  }
  return [...new Set(res)];
}
