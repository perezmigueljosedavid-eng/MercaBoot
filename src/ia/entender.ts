import { FESTIVIDADES_ASISTENTE } from '../data/festividades';
import type { Negocio, Sabor } from '../data/tipos';
import type { Criterio } from './comparar';
import { ingredientesEnTexto, INGREDIENTES } from './ingredientes';
import { RECETAS } from './recetas';
import type { Momento, Receta } from './recetas';
import { buscarFrase, igual, norm, palabraCoincide, tokens } from './texto';
import type { Memoria } from './vista';

export type Tipo =
  | 'saludo'
  | 'gracias'
  | 'despedida'
  | 'ayuda'
  | 'pasos'
  | 'donde'
  | 'otra'
  | 'recetas'
  | 'producto'
  | 'tienda'
  | 'cerca'
  | 'avisos'
  | 'hoy'
  | 'sugerir'
  | 'ingrediente'
  | 'receta_desconocida'
  /** Ranking de tiendas: mejor calificadas, más baratas, con domicilio… */
  | 'tiendas'
  /** Volver a ordenar la última búsqueda de productos ("por precio", "por estrellas"). */
  | 'ordenar'
  | 'nada';

export interface Entendido {
  tipo: Tipo;
  sabor?: Sabor;
  momento?: Momento;
  rapido: boolean;
  economico: boolean;
  vegetariano: boolean;
  caliente: boolean;
  /** "Algo con carne" (res, cerdo, pollo, pescado…) o "algo con proteína" (además huevo, queso, frijol…). */
  dieta?: 'carne' | 'proteina';
  /** "Algo de solo verduras": platillos donde las verduras son lo principal. */
  soloVerduras: boolean;
  /** "Algo ligero / saludable". */
  ligero: boolean;
  /** "Un plato fuerte": comida completa que llene. */
  platoFuerte: boolean;
  /** "Algo oaxaqueño / típico / tradicional". */
  oaxaca: boolean;
  /** Quiere algo ya preparado, sin cocinar. */
  listo: boolean;
  /** Festividad que mencionó (id de data/festividades). */
  festividad?: string;
  /** Cómo quiere comparar tiendas: precio, estrellas o cercanía. */
  ordenar?: Criterio;
  /** Pregunta por servicio a domicilio. */
  domicilio: boolean;
  /** Pide que le digan cuál tienda le conviene. */
  conviene?: boolean;
  /** Preguntó dónde conseguir algo («dónde hay», «venden», «busco»…). */
  pideDonde?: boolean;
  /** Quiere algo más elaborado, sin prisa (quita el "rápido" de antes). */
  sinPrisa: boolean;
  personas?: number;
  /** Cada grupo es "cualquiera de estos ingredientes". */
  grupos: string[][];
  excluir: string[];
  /** La persona dijo que ya tiene esos ingredientes ("tengo pollo"). */
  tengo: boolean;
  recetas: Receta[];
  negocios: Negocio[];
  /** Palabras sueltas para buscar por nombre de producto cuando el diccionario no lo conoce. */
  palabras: string[];
  /** Lo que escribió la persona para nombrar el producto, con sus acentos. */
  dicho: string;
  pideReceta: boolean;
  /** Pidió otra opción o un cambio sobre lo que ya se le mostró. */
  pideOtra: boolean;
}

/* ───────── vocabulario ───────── */

const P = (s: string) => s.split('|').map((x) => tokens(x));
const tiene = (t: string[], frases: string[][]) => frases.some((f) => buscarFrase(t, f) > 0);

const V = {
  saludo: P('hola|holi|holaa|buenas|buenos dias|buen dia|buenas tardes|buenas noches|que tal|hey|saludos|que onda|ola'),
  gracias: P('gracias|muchas gracias|mil gracias|te agradezco|perfecto|genial|excelente|super|ok|vale|listo|esta bien|muy bien|que rico|chido|padre|buenisimo'),
  despedida: P('adios|hasta luego|nos vemos|bye|chao|hasta pronto|me voy'),
  ayuda: P('ayuda|ayudame|que puedes hacer|que haces|como funcionas|para que sirves|que sabes|quien eres|que eres|como te uso|como funciona|que ofreces'),
  pasos: P('como se hace|como lo hago|como la hago|como se prepara|como lo preparo|como la preparo|como se cocina|como lo cocino|como la cocino|paso a paso|pasos|procedimiento|preparacion|instrucciones|ingredientes|receta|recetas|como hago|como preparo|como cocino|como se elabora|como se hacen'),
  donde: P('donde|en que tienda|que tienda|quien vende|quien tiene|venden|vende|tienen|tiene|consigo|conseguir|encuentro|encontrar|compro|comprar|comprarlo|comprarla|hay|busco|buscando|necesito|ocupo|me falta|existen|hay en'),
  otra: P('otra|otro|otras|otros|otra opcion|otras opciones|otra idea|otras ideas|mas ideas|algo mas|que mas|no me gusta|no quiero eso|diferente|distinto|siguiente|cambia|cambiale|y otra|alguna otra|otra receta|mejor'),
  hoy: P('que hay hoy|que hay|que tienen hoy|que venden|que productos hay|que hay disponible|que tienen|que hay de nuevo|productos de hoy|que hay en las tiendas|que se vende|todo lo que hay|que encuentro'),
  avisos: P('promocion|promociones|promo|promos|oferta|ofertas|descuento|descuentos|regalo|regalos|obsequio|obsequios|aviso|avisos|novedades|rebaja|rebajas|aguinaldo|trastes|cubetas|bolsas de mandado|sorteo|rifa|2x1|regalan|regalando'),
  cerca: P('cerca|cercana|cercanas|cercano|cercanos|mas cerca|a la mano|por aqui|por mi casa|mi ubicacion|cerquita|junto a mi|tienda cercana|cercania|por cercania|distancia|por distancia|queda cerca|me queda mas cerca'),
  sugerir: P('antoja|antojo|se me antoja|que cocino|que preparo|que hago de comer|que como|que cenamos|que desayunamos|que comemos|ideas|idea|sugerencia|sugerencias|recomienda|recomiendas|recomiendame|recomendacion|cocinar|platillo|platillos|plato|guiso|guisado|que puedo cocinar|que puedo hacer|que puedo preparar|que hago|que se te ocurre|sorprendeme|inspirame|que ceno|que desayuno|hambre|tengo hambre|hambriento|hambrienta'),
  cocinar: P('cocino|cocinar|preparo|preparar|hago|hacer|receta|recetas|platillo|idea|ideas|guiso|antoja|antojo|comer|cenar|desayunar|que como|puedo hacer|puedo cocinar|con que|que hago|sirve|sirven|preparo|cocinando'),
  dulce: P('dulce|dulces|dulcecito|dulcesito|postre|postres|golosina|golosinas|azucarado'),
  salado: P('salado|salada|salados|saladas|saladito|saladita'),
  picante: P('picante|picantes|picoso|picosa|picosos|picosito|picosita|enchiloso|enchilosa|enchilosito|enchilante|que pique|con pique|con picor'),
  acido: P('acido|acida|agrio|agria|acidito|citrico'),
  amargo: P('amargo|amarga'),
  desayuno: P('desayuno|desayunos|desayunar|almuerzo|almorzar'),
  comida: P('comida|comidas|almuerzo'),
  cena: P('cena|cenar|cenamos|merienda|meriendas|cenita'),
  botana: P('botana|botanas|botanear|botanita|botanitas|snack|snacks|picoteo|para picar|antojito|antojitos'),
  postre: P('postre|postres'),
  bebida: P('bebida|bebidas|beber|tomar|refrescar|refrescante|sed|calor|calorcito|hace calor'),
  rapido: P('rapido|rapida|rapidito|rapidisimo|facil|faciles|sencillo|sencilla|simple|express|pocos minutos|poco tiempo|sin tiempo|de prisa|de volada|rapidamente'),
  barato: P('barato|barata|baratos|baratas|baratito|economico|economica|economicos|economicas|poco dinero|ahorrar|ahorrador|sin gastar|presupuesto|de bajo costo|que no cueste|que salga barato|poco presupuesto|con poquito dinero|economia'),
  carne: P('carne|carnes|carnita|carnitas|carnivoro'),
  proteina: P('proteina|proteinas|proteico|proteica|alto en proteina|rico en proteina|gym|gimnasio|musculo|musculos'),
  soloVerduras: P('solo verduras|solo verdura|puras verduras|pura verdura|nada mas verduras|solo vegetales|puro vegetal|solo de verduras|de puras verduras|verduritas|solo hortalizas'),
  ligero: P('ligero|ligera|ligeros|ligeras|saludable|saludables|sano|sana|light|fit|dieta|liviano|liviana|cuidar la linea|bajar de peso'),
  platoFuerte: P('plato fuerte|platillo fuerte|plato principal|comida fuerte|algo fuerte|contundente|sustancioso|sustanciosa|que llene|me llene|llenador|llenadora|abundante|bien servido|comida completa|algo pesado|mucha hambre'),
  oaxaca: P('oaxaqueno|oaxaquena|oaxaquenos|oaxaquenas|tipico|tipica|tipicos|tipicas|tradicional|tradicionales|regional|regionales|de mi tierra|de la region|comida de oaxaca|platillo de oaxaca|antojitos oaxaquenos'),
  listo: P('ya preparado|ya preparada|ya preparados|ya preparadas|ya hecho|ya hecha|ya hechos|ya listo|ya lista|ya cocinado|ya cocinada|listo para comer|lista para comer|listos para comer|para comer ya|comida hecha|comida lista|comprar hecho|para llevar|no quiero cocinar|no tengo ganas de cocinar|sin cocinar|no cocino|no voy a cocinar|que ya este hecho|que ya este preparado|ya cocinado'),
  familia: P('toda la familia|para la familia|para compartir|para varios|para muchos|para mucha gente|para una reunion|para una fiesta|para invitados|familiar|para todos'),
  mejorCalif: P('mejor calificada|mejor calificado|mejores calificadas|mejores calificados|bien calificada|bien calificadas|mejor valorada|mejores valoradas|mejor reputacion|buena reputacion|mas estrellas|estrellas|calificacion|calificaciones|valoracion|reputacion|resenas|opiniones|mas recomendada|mas recomendadas|la mejor tienda|las mejores tiendas|mejor tienda|mejores tiendas|tienda confiable|de confianza|por estrellas'),
  masBarato: P('mas barato|mas barata|mas baratos|mas baratas|mas economico|mas economica|mas economicos|mas economicas|mejor precio|mejores precios|menor precio|precio mas bajo|mas accesible|mas accesibles|cuesta menos|cuestan menos|sale mas barato|sale mas barata|menos caro|menos cara|por precio'),
  domicilio: P('domicilio|a domicilio|servicio a domicilio|envian|envio|envios|entregan|entrega|entregas|reparten|reparto|llevan a mi casa|lo llevan|lo traen|a mi casa|delivery'),
  dondeBarato: P('donde esta mas barato|donde sale mas barato|donde es mas barato|donde cuesta menos|donde esta mas economico|tienda mas barata|tiendas mas baratas|lo mas barato hoy|lo mas barato|que esta mas barato|ofertas de hoy|precios bajos|comparar precios|compara precios|comparar tiendas|mejor precio'),
  sinPrisa: P('elaborado|elaborada|mas elaborado|mas elaborada|complicado|complicada|con tiempo|con calma|sin prisa|sin prisas|mas completo|mas completa|gourmet|especial'),
  vegetariano: P('vegetariano|vegetariana|vegetarianos|sin carne|vegano|vegana|sin carnes|no como carne'),
  caliente: P('caliente|calientito|calientita|calentito|para el frio|hace frio|con frio|friolento'),
  /** "¿Cuál me conviene?": quiere que la app le diga qué tienda elegir. */
  conviene: P('me conviene|nos conviene|conviene mas|conviene mejor|cual conviene|cual es mejor|cual es la mejor|cual es el mejor|cual me recomiendas|cual recomiendas|cual elijo|cual escojo|cual compro|cual elegir|cual escoger|donde compro mejor|la mejor opcion|mejor opcion|que tienda elijo|que tienda me conviene|tienda me conviene|en cual compro|a cual voy|a donde voy|donde voy'),
  tengo: P('tengo|me sobro|me sobraron|sobro|sobraron|en mi casa hay|en casa tengo|me quedo|me quedaron|ya tengo|cuento con'),
};

/** Palabras del vocabulario de antojos: describen lo que se quiere comer, no el nombre de una tienda. */
const CONSUMIDAS = new Set<string>();
function sumarConsumidas() {
  for (const clave of ['dulce', 'salado', 'picante', 'acido', 'amargo', 'desayuno', 'comida', 'cena', 'botana', 'postre', 'bebida', 'rapido', 'barato', 'carne', 'proteina', 'soloVerduras', 'ligero', 'platoFuerte', 'oaxaca', 'listo', 'familia', 'vegetariano', 'caliente', 'sugerir', 'cocinar', 'pasos'] as const) {
    for (const frase of V[clave]) for (const w of frase) CONSUMIDAS.add(w);
  }
  // Ni "tienda" ni "tiendas": identifican qué se busca, no cuál
  for (const w of ['tienda', 'tiendas', 'negocio', 'negocios']) CONSUMIDAS.add(w);
}

/** Palabras que sobran al buscar un producto por nombre. */
const RELLENO = new Set(
  (
    'donde dónde hay venden vende tienen tiene tienda tiendas algun alguna alguno alguien que quien quiero busco buscando necesito ocupo ' +
    'comprar compro conseguir consigo encuentro encontrar puedo cerca de del la el los las un una unos unas en por favor para me mi mis y o con sin ' +
    'hoy ahora aqui alli esta estan disponible disponibles stock existencia cuanto cuesta cuestan precio precios hola buenas porfa pues oye dime ' +
    'algo muy mas menos tambien pero como se te lo le les es son ser tengo gustaria quisiera quieres antoja antojo comer cocinar cocino preparo ' +
    'receta recetas hace hacen prepara preparan paso pasos ingredientes instrucciones procedimiento preparacion elabora elaboran cocina cocinan preparamos hacemos ideas idea negocio negocios pueblo comunidad san javier estoy estamos hacer hago voy vamos dar damelo dame ver mostrar muestrame'
  )
    .split(' ')
    .map((w) => norm(w)),
);

/** Las palabras del vocabulario nuevo (barato, estrellas, domicilio…) nunca son el nombre de un producto. */
function sumarRelleno() {
  for (const clave of ['carne', 'proteina', 'soloVerduras', 'ligero', 'platoFuerte', 'oaxaca', 'listo', 'familia', 'mejorCalif', 'masBarato', 'dondeBarato', 'sinPrisa', 'domicilio', 'barato', 'cerca', 'conviene'] as const) {
    for (const frase of V[clave]) for (const w of frase) RELLENO.add(w);
  }
  for (const w of ['filtrar', 'ranking', 'servicio', 'servicios', 'lista', 'primero', 'primeros', 'primera', 'primeras', 'luego', 'despues', 'ahorita', 'pon', 'ponlo', 'ponla', 'ponlos', 'ponlas', 'ponme', 'quiero', 'cual', 'cuales']) RELLENO.add(norm(w));
}
sumarRelleno();
sumarConsumidas();

/**
 * Verbos de "ordenar" con sus pronombres pegados (ordénalo, ordénalas, acomódalos, muéstrame…): piden cambiar el orden,
 * nunca son el nombre de un producto.
 */
const VERBOS_DE_ORDEN = /^(orden|acomod|prioriz|clasific|filtr|muestr|mostr|ensen|listam|listal|pon(?:lo|la|los|las|me)$)/;
const esRelleno = (w: string) => RELLENO.has(w) || VERBOS_DE_ORDEN.test(w);

/** Palabras genéricas que significan "cualquiera de estos". */
const GRUPO_VERDURAS = ['calabacita', 'zanahoria', 'chayote', 'papa', 'nopal', 'ejote', 'brocoli', 'cebolla', 'jitomate'];
const GRUPOS: [string[], string[]][] = [
  [['fruta', 'frutas'], ['fruta', 'platano', 'mango', 'manzana', 'naranja', 'pina', 'papaya', 'melon']],
  [['verdura', 'verduras'], GRUPO_VERDURAS],
  [['mariscos', 'marisco'], ['camaron', 'pescado', 'atun']],
  [['pan'], ['bolillo', 'pan_dulce', 'pan_yema', 'pan_caja', 'pan']],
  [['sopa'], ['pasta']],
  [['ensalada'], ['lechuga', 'jitomate', 'pepino']],
];

const COMUNIDAD_PAL = new Set(['san', 'javier', 'francisco', 'xoxocotlan', 'santa', 'cruz', 'oaxaca']);
const STOP_NOMBRE = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'y', 'e', 'en', 'mi', 'su', 'a', 'al']);

const NUM: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20,
};

export function personasEn(n: string): number | undefined {
  if (/\b(para mi|solo yo|soy yo|para una persona|para uno)\b/.test(n)) return 1;
  const palabra = Object.keys(NUM).join('|');
  const fin = '(?=\\s*(?:personas|gente|invitados|comensales)|\\s*$|\\s*[,.;!?])';
  const m = n.match(new RegExp(`\\b(?:para|somos|seremos|son|seran)\\s+(\\d{1,2}|${palabra})${fin}`));
  const m2 = n.match(/\b(\d{1,2})\s+(?:personas|gente|invitados|comensales)\b/);
  const v = m?.[1] ?? m2?.[1];
  if (!v) return undefined;
  const num = /^\d+$/.test(v) ? parseInt(v, 10) : NUM[v];
  return num >= 1 && num <= 60 ? num : undefined;
}

/* ───────── negocios y recetas mencionados ───────── */

export function negociosEn(t: string[], negocios: Negocio[]): Negocio[] {
  const res: { n: Negocio; m: number }[] = [];
  for (const n of negocios) {
    const nt = [...new Set([...tokens(n.nombre), ...tokens(n.giro)])].filter((w) => !STOP_NOMBRE.has(w));
    let m = 0;
    let fuerte = false;
    for (const w of nt) {
      if (t.some((q) => palabraCoincide(q, w, w.length >= 6))) {
        m++;
        if (w.length >= 4 && !COMUNIDAD_PAL.has(w)) fuerte = true;
      }
    }
    if (m && fuerte) res.push({ n, m });
  }
  if (!res.length) return [];
  const max = Math.max(...res.map((r) => r.m));
  return res.filter((r) => r.m === max).map((r) => r.n);
}

const PARTICULAS = new Set(['de', 'con', 'y', 'en', 'al', 'a', 'la', 'el', 'las', 'los', 'del', 'o']);

/** Palabras que describen cómo está un platillo pero no lo identifican ("caliente", "verde"…). */
const NO_PLATO = new Set([
  'caliente', 'frio', 'frito', 'frita', 'dulce', 'salado', 'rojo', 'roja', 'rojos', 'verde', 'verdes', 'mexicana', 'mexicano',
  'oaxaquena', 'oaxaqueno', 'fresca', 'fresco', 'rapido', 'facil', 'casa', 'simple', 'tradicional', 'cocido', 'cocida',
]);

/** Palabras de ingredientes que, al pedir una receta, se entienden como un platillo ("receta de tlayudas"). */
const ALIAS_PLATO: [string, string[]][] = [
  ['tlayuda', ['tlayuda-tasajo']],
  ['tostada', ['tostadas-pollo', 'tostadas-atun', 'tinga-pollo']],
  ['memela', ['memelas-frijol']],
  ['sope', ['sopes-frijol-queso']],
  ['mole', ['pollo-mole']],
  ['torta', ['tortas-quesillo-aguacate']],
  ['frijol', ['frijoles-olla', 'enfrijoladas']],
  ['arroz', ['arroz-rojo', 'arroz-con-leche']],
  ['bistec', ['bistec-encebollado', 'tacos-bistec']],
  ['elote', ['elote-cocido', 'esquites']],
  ['chocolate', ['chocolate-pan-yema']],
  ['atole', ['atole-masa']],
  ['champurrado', ['atole-masa']],
  ['cafe', ['cafe-de-olla']],
  ['hotcakes', ['hotcakes-miel-platano']],
  ['jamaica', ['agua-jamaica']],
  ['nopal', ['ensalada-nopales']],
  ['camote', ['camotes-piloncillo']],
  ['calabaza', ['calabaza-tacha']],
  ['pescado', ['pescado-ajo-limon']],
  ['camaron', ['camarones-ajillo']],
  ['milanesa', ['milanesas']],
  ['chuleta', ['chuletas-salsa-verde']],
  ['chicharron', ['chicharron-salsa-verde']],
  ['papa', ['papas-chorizo', 'tacos-dorados-papa']],
  ['sopa', ['sopa-pasta']],
  ['pollo', ['pollo-mole', 'caldo-pollo', 'tostadas-pollo', 'tinga-pollo']],
];

let GENERICAS: string[] | null = null;
/** Palabra que es el nombre de un ingrediente ("pollo", "huevos"): sola no basta para pedir una receta. */
function esGenerica(w: string): boolean {
  if (!GENERICAS) {
    const set = new Set<string>();
    for (const ing of Object.values(INGREDIENTES)) {
      if (ing.cat === 'preparado' || ing.platillo) continue;
      for (const f of ing.frases) if (f.length === 1) set.add(f[0]);
    }
    GENERICAS = [...set];
  }
  return GENERICAS.some((g) => igual(w, g));
}

/**
 * Recetas cuyo nombre aparece en el mensaje ("receta de tlayudas", "cómo hago pollo con mole").
 * Una palabra de ingrediente sola ("pollo") no cuenta: eso es buscar ideas con ese ingrediente.
 */
export function recetasEn(t: string[], pideReceta = false): Receta[] {
  const res: { r: Receta; puntos: number }[] = [];
  for (const r of RECETAS) {
    const clave = tokens(r.nombre).filter((w) => !PARTICULAS.has(w));
    if (!clave.length) continue;
    const coinciden = clave.map((w) => t.some((q) => palabraCoincide(q, w, w.length >= 7) > 0));
    const exactas = clave.map((w) => t.some((q) => igual(q, w)));
    const n = coinciden.filter(Boolean).length;
    if (!n) continue;
    const plato = clave.some((w, i) => exactas[i] && w.length >= 5 && !esGenerica(w) && !NO_PLATO.has(w));
    const completa = n === clave.length;
    if (!completa && !plato && !(n >= 2 && n / clave.length >= 0.6)) continue;
    res.push({ r, puntos: n * 10 + (plato ? 5 : 0) - clave.length });
  }
  if (pideReceta) {
    for (const [palabra, ids] of ALIAS_PLATO) {
      if (!t.some((q) => igual(q, palabra))) continue;
      for (const id of ids) {
        const r = RECETAS.find((x) => x.id === id);
        if (r && !res.some((x) => x.r.id === id)) res.push({ r, puntos: 12 });
      }
    }
  }
  res.sort((a, b) => b.puntos - a.puntos);
  if (!res.length) return [];
  const mejor = res[0].puntos;
  return res.filter((x) => x.puntos >= mejor - 1).slice(0, 3).map((x) => x.r);
}

/* ───────── entender el mensaje ───────── */

function ingredientes(texto: string): { grupos: string[][]; excluir: string[]; sinCarne: boolean } {
  const partes = norm(texto).split(/\b(?:sin|no tengo|no tenemos|no hay|no me queda|no quiero|no queremos|no como|ni)\b/);
  const positivo = [partes[0]];
  const negativo: string[] = [];
  for (const p of partes.slice(1)) {
    const palabras = p.trim().split(/\s+/);
    negativo.push(palabras.slice(0, 3).join(' '));
    positivo.push(palabras.slice(3).join(' '));
  }
  const negTexto = negativo.join(' ');
  const excluir = ingredientesEnTexto(negTexto);
  const grupos: string[][] = ingredientesEnTexto(positivo.join(' ')).filter((i) => !excluir.includes(i)).map((i) => [i]);
  const tp = tokens(positivo.join(' '));
  for (const [palabras, ids] of GRUPOS) {
    if (palabras.some((w) => tp.includes(w)) && !grupos.some((g) => g.some((i) => ids.includes(i)))) grupos.push(ids);
  }
  return { grupos, excluir, sinCarne: /\bcarnes?\b/.test(negTexto) };
}

/** Las palabras que escribió la persona (con sus acentos) que quedan después de quitar el relleno. */
function palabrasDichas(texto: string): string[] {
  const originales = texto.match(/[\p{L}\p{N}]+/gu) ?? [];
  const info = originales.map((w) => {
    const n = norm(w).replace(/[^a-z0-9]/g, '');
    return { w, n, contenido: n.length >= 3 && !esRelleno(n) };
  });
  // "pechuga de pollo", "fresas con crema": el "de" o el "con" que une dos palabras del nombre se conserva
  const UNION = new Set(['de', 'del', 'con', 'en']);
  return info.filter((x, i) => x.contenido || (UNION.has(x.n) && info[i - 1]?.contenido && info[i + 1]?.contenido)).map((x) => x.w);
}

/** Festividades con sus frases ya separadas en palabras. */
const FIESTAS = FESTIVIDADES_ASISTENTE.map((f) => ({ id: f.id, frases: P(f.palabras) }));

/** Festividad que menciona el mensaje y las palabras con las que la nombró. */
function festividadEn(t: string[]): { id: string; palabras: string[] } | undefined {
  for (const f of FIESTAS) {
    for (const frase of f.frases) if (buscarFrase(t, frase) > 0) return { id: f.id, palabras: frase };
  }
  return undefined;
}

export function entender(texto: string, negocios: Negocio[], mem: Memoria): Entendido {
  const n = norm(texto);
  const t = tokens(texto);

  let sabor: Sabor | undefined;
  if (tiene(t, V.dulce)) sabor = 'dulce';
  else if (tiene(t, V.picante)) sabor = 'picante';
  else if (tiene(t, V.salado)) sabor = 'salado';
  else if (tiene(t, V.acido)) sabor = 'acido';
  else if (tiene(t, V.amargo)) sabor = 'amargo';

  let momento: Momento | undefined;
  if (tiene(t, V.postre)) momento = 'postre';
  else if (tiene(t, V.desayuno)) momento = 'desayuno';
  else if (tiene(t, V.cena)) momento = 'cena';
  else if (tiene(t, V.botana)) momento = 'botana';
  else if (tiene(t, V.bebida)) momento = 'bebida';
  else if (tiene(t, V.comida)) momento = 'comida';

  // «San Valentín» es la fiesta, no la salsa Valentina (el diccionario tolera una letra de diferencia)
  const { grupos: gruposTodos, excluir, sinCarne: niegaCarne } = ingredientes(texto.replace(/\bsan\s+valent[ií]n\b/gi, ' '));
  const sinCarne = tiene(t, V.vegetariano) || niegaCarne;
  const soloVerduras = tiene(t, V.soloVerduras);
  // "solo verduras" es un tipo de platillo, no una lista de ingredientes que buscar
  const grupos = soloVerduras ? gruposTodos.filter((g) => g !== GRUPO_VERDURAS) : gruposTodos;
  const dieta: Entendido['dieta'] = !sinCarne && tiene(t, V.carne) ? 'carne' : tiene(t, V.proteina) ? 'proteina' : undefined;
  const platoFuerte = tiene(t, V.platoFuerte);
  if (platoFuerte && !momento) momento = 'comida';
  const fiesta = festividadEn(t);
  const pideReceta = tiene(t, V.pasos);
  // "solo verduras" describe lo que se quiere, no pide "Sopa de verduras" por su nombre
  const palabrasTipo = new Set(soloVerduras ? V.soloVerduras.filter((f) => buscarFrase(t, f) > 0).flat() : []);
  const recetas = recetasEn(palabrasTipo.size ? t.filter((w) => !palabrasTipo.has(w)) : t, pideReceta);
  // Las palabras que ya se entendieron como antojo ("dulce", "cocino") no sirven para adivinar la tienda ("Pastelería Dulce Vida")
  const lugares = negociosEn(t.filter((w) => !CONSUMIDAS.has(w)), negocios);
  const pideDonde = tiene(t, V.donde);
  const palabras = t.filter((w) => w.length >= 3 && !esRelleno(w) && !(fiesta?.palabras.includes(w)));

  const pideEstrellas = tiene(t, V.mejorCalif);
  const pideDondeBarato = tiene(t, V.dondeBarato);
  const pidePrecio = tiene(t, V.masBarato) || pideDondeBarato;
  // "tiendas cerca de mí" pide un listado de tiendas; "más cerca" o "por cercanía" solo reordena
  const pideTiendas = t.includes('tienda') || t.includes('tiendas') || t.includes('negocio') || t.includes('negocios');
  const ordenCerca = tiene(t, V.cerca) && !pideTiendas;
  const ordenar: Criterio | undefined = pidePrecio ? 'precio' : pideEstrellas ? 'estrellas' : ordenCerca ? 'cerca' : undefined;
  const domicilio = tiene(t, V.domicilio);
  const pideConviene = tiene(t, V.conviene);
  // "mejor calificadas" o "mejor precio" llevan la palabra "mejor" pero no piden otra opción
  const pideOtra = tiene(t, V.otra) && !pideEstrellas && !pideDondeBarato;

  const e: Entendido = {
    tipo: 'nada',
    sabor,
    momento,
    rapido: tiene(t, V.rapido),
    economico: tiene(t, V.barato),
    vegetariano: sinCarne || soloVerduras,
    caliente: tiene(t, V.caliente),
    dieta,
    soloVerduras,
    ligero: tiene(t, V.ligero),
    platoFuerte,
    oaxaca: tiene(t, V.oaxaca),
    listo: tiene(t, V.listo),
    festividad: fiesta?.id,
    ordenar,
    domicilio,
    conviene: pideConviene,
    pideDonde,
    sinPrisa: tiene(t, V.sinPrisa),
    personas: personasEn(n) ?? (tiene(t, V.familia) ? 6 : undefined),
    grupos,
    excluir,
    tengo: tiene(t, V.tengo) && !/\bno\s+(?:tengo|tenemos|me queda|hay)\b/.test(n),
    recetas,
    negocios: lugares,
    palabras,
    dicho: palabrasDichas(texto).join(' '),
    pideReceta,
    pideOtra,
  };

  const corto = t.length <= 6;
  // Lo que pide un tipo de platillo (no una tienda ni un ingrediente concreto)
  const pideTipoPlatillo = !!(sabor || momento || e.dieta || soloVerduras || e.ligero || platoFuerte || e.oaxaca || e.listo);
  const pideComparar = !!(ordenar || domicilio);
  const hayContenido = grupos.length > 0 || pideTipoPlatillo || !!e.festividad || recetas.length > 0 || lugares.length > 0;
  const hayRecetasEnMemoria = mem.recetasMostradas.length > 0 || !!mem.ultimaReceta;

  if (!hayContenido) {
    if (tiene(t, V.ayuda)) e.tipo = 'ayuda';
    else if (tiene(t, V.despedida) && corto) e.tipo = 'despedida';
    else if (tiene(t, V.gracias) && corto && !pideOtra) e.tipo = 'gracias';
    else if (tiene(t, V.saludo) && corto) e.tipo = 'saludo';
    else if ((pideComparar || pideConviene) && !pideTiendas && mem.modo === 'productos' && mem.busqueda && palabras.length === 0) e.tipo = 'ordenar';
    else if (pideConviene && mem.ultimaReceta && mem.modo === 'recetas' && palabras.length === 0) e.tipo = 'donde';
    else if (pideConviene && palabras.length === 0) e.tipo = 'tiendas';
    else if (pideOtra && (hayRecetasEnMemoria || mem.sabor || mem.momento)) e.tipo = 'otra';
    else if (pideReceta && palabras.length) e.tipo = 'receta_desconocida';
    else if (mem.ultimaReceta && pideReceta) e.tipo = 'pasos';
    else if (pideDondeBarato && palabras.length === 0) e.tipo = 'tiendas';
    else if (mem.ultimaReceta && pideDonde && palabras.length === 0) e.tipo = 'donde';
    else if (tiene(t, V.avisos)) e.tipo = 'avisos';
    else if (pidePrecio && hayRecetasEnMemoria && mem.modo === 'recetas' && !pideTiendas) e.tipo = 'otra';
    else if ((pideEstrellas || pidePrecio || domicilio) && palabras.length === 0) e.tipo = 'tiendas';
    else if (pideComparar && palabras.length) e.tipo = 'producto';
    else if (tiene(t, V.cerca) && palabras.every((w) => ['cerca', 'cercana', 'cercanas', 'cercano', 'cercanos', 'cerquita', 'ubicacion', 'aqui'].includes(w))) e.tipo = 'cerca';
    else if (tiene(t, V.hoy)) e.tipo = 'hoy';
    else if (tiene(t, V.sugerir) || tiene(t, V.cocinar)) e.tipo = 'sugerir';
    else if ((e.rapido || e.economico || e.vegetariano || e.caliente || e.personas) && hayRecetasEnMemoria) e.tipo = 'otra';
    else if (e.rapido || e.economico || e.vegetariano || e.caliente) e.tipo = 'sugerir';
    else if (pideOtra) e.tipo = 'sugerir';
    else e.tipo = 'nada';
    return e;
  }

  if (recetas.length && (!grupos.length || pideReceta)) {
    e.tipo = 'recetas';
    return e;
  }
  if (lugares.length) {
    e.tipo = grupos.length ? 'producto' : 'tienda';
    return e;
  }
  if (tiene(t, V.avisos) && !grupos.length && !pideTipoPlatillo) {
    e.tipo = 'avisos';
    return e;
  }
  if (grupos.length) {
    if (pideComparar && !tiene(t, V.cocinar) && !e.tengo) e.tipo = 'producto';
    else if (pideDonde && !tiene(t, V.cocinar) && !e.tengo) e.tipo = 'producto';
    else if (e.tengo || tiene(t, V.cocinar) || pideTipoPlatillo || palabras.length > grupos.length + 1) e.tipo = 'sugerir';
    else e.tipo = 'ingrediente';
    return e;
  }
  e.tipo = 'sugerir';
  return e;
}
