import { INGREDIENTES } from './ingredientes';
import { recetaIAPorClave, todasLasRecetas } from './recetas';
import type { Receta } from './recetas';
import { igual, norm, palabraCoincide, tokens } from './texto';

/**
 * Entender el nombre de un platillo que escribe la persona («dame la receta del pollo en salsa roja», «galletas», «cómo se hacen unos tamales»).
 *
 * Primero se quita el relleno («dame la receta de…», «se me antoja…»); lo que queda se compara con el nombre de cada receta:
 *  · exacta     el nombre completo de la receta está en lo que escribió («pollo en salsa verde»).
 *  · variantes  escribió solo el platillo y hay varias formas de hacerlo («galletas» → mantequilla, avena, chispas).
 *  · cercanas   se parece pero no es: nunca se muestra como si fuera la respuesta, solo se ofrece.
 * Si dos palabras se contradicen («roja» y «verde», «fresa» y «plátano», «pollo» y «res»), esa receta no es la que pidió.
 *
 * Autor: José David Pérez Miguel
 */

export interface PlatilloPedido {
  /** Lo que parece ser el nombre del platillo, con sus acentos y sin relleno («pollo a la naranja»). */
  consulta: string;
  /** Lo mismo en palabras sin acentos ni mayúsculas. */
  toks: string[];
  /** Las palabras unidas, para reconocer la misma petición después. */
  clave: string;
}

export interface Calce {
  tipo: 'exacta' | 'variantes' | 'cercanas' | 'ninguna';
  recetas: Receta[];
  /** Todo lo que escribió (menos el relleno) corresponde a la receta: no pidió además otra cosa. */
  pura: boolean;
  /** Lo que escribió son solo nombres de ingredientes («pollo», «tlayudas»): puede querer comprarlos, no una receta. */
  soloCrudos: boolean;
}

const NINGUNO: Calce = { tipo: 'ninguna', recetas: [], pura: false, soloCrudos: false };

/* ───────── quitar el relleno ───────── */

const FRASES_INICIO: string[][] = [
  'tengo ganas de',
  'tengo antojo de',
  'tengo antojo',
  'se me antoja',
  'se me antojan',
  'me gustaria hacer',
  'me gustaria preparar',
  'me gustaria',
  'que tal',
  'ideas de',
  'ideas para',
  'idea de',
  'recetas de',
  'receta de',
  'receta para',
  'como se hacen',
  'como se hace',
  'como hacer',
  'como preparar',
  'como se prepara',
  'como se preparan',
  'como puedo hacer',
  'como puedo preparar',
  'me puedes decir como',
  'me puedes dar',
].map((f) => f.split(' '));

const RELLENO_INICIO = new Set(
  (
    'dame damela dime quiero quisiera necesito busco pasame ensename muestrame hazme das puedes puedo darme decirme decir ayudas ayudame ' +
    'la el los las un una unos unas receta recetas preparacion de del para a como se hace hacen hacer preparar prepara preparan cocinar cocina cocinan ' +
    'hago preparo cocino antoja antojan antojo comer cenar desayunar voy vamos algo idea ideas platillo plato que tal me ' +
    'ingredientes ingrediente lista pasos procedimiento instrucciones'
  ).split(' '),
);

const RELLENO_FINAL = new Set('por favor porfa porfis gracias paso a paso facil rapido rapidito sencillo sencilla casero casera rico rica deliciosa delicioso jugoso jugosa urgente hoy ahorita ya mismo'.split(' '));

const coincideEn = (t: string[], i: number, f: string[]) => f.every((w, k) => t[i + k] === w);

/** Quita el relleno del principio y del final y devuelve lo que parece ser el nombre del platillo. */
export function limpiarPlatillo(texto: string): PlatilloPedido {
  const originales: string[] = [];
  const nn: string[] = [];
  for (const w of texto.match(/[\p{L}\p{N}]+/gu) ?? []) {
    const n = norm(w).replace(/[^a-z0-9]/g, '');
    if (!n) continue;
    originales.push(w);
    nn.push(n);
  }
  let i = 0;
  let j = nn.length;
  for (let seguir = true; seguir && i < j; ) {
    seguir = false;
    const frase = FRASES_INICIO.find((f) => i + f.length <= j && coincideEn(nn, i, f));
    if (frase) {
      i += frase.length;
      seguir = true;
    } else if (RELLENO_INICIO.has(nn[i])) {
      i++;
      seguir = true;
    }
  }
  while (j > i && RELLENO_FINAL.has(nn[j - 1])) j--;
  const toks = nn.slice(i, j);
  return { consulta: originales.slice(i, j).join(' '), toks, clave: toks.join(' ') };
}

/* ───────── palabras que no cambian el platillo ───────── */

/** Palabras de enlace: no sirven para reconocer un platillo. */
export const PARTICULAS = new Set(['de', 'del', 'con', 'y', 'en', 'al', 'a', 'la', 'el', 'las', 'los', 'o', 'para', 'sin', 'por', 'e', 'un', 'una', 'unos', 'unas', 'lo', 'le']);

/** Adjetivos que describen cómo es un platillo pero no cuál es («casero», «tradicional»). */
const LIGERAS = new Set(['casero', 'casera', 'caseros', 'caseras', 'tradicional', 'rico', 'rica', 'facil', 'sencillo', 'sencilla', 'simple', 'rapido', 'rapida', 'natural', 'fresco', 'fresca', 'especial', 'clasico', 'clasica', 'tipico', 'tipica', 'casa']);

/** Palabras que dicen cuánta gente comerá: no cambian de qué platillo se habla. */
const NEUTRAS = new Set(['personas', 'persona', 'gente', 'invitados', 'comensales', 'porciones', 'raciones', 'familia', 'nosotros', 'somos', 'seremos', 'seran', 'son', 'mi', 'mis', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'doce']);

const esNeutra = (w: string) => NEUTRAS.has(w) || /^\d+$/.test(w);

/**
 * Familias de palabras que se contradicen: dentro de una familia, cada fila es un valor distinto.
 * Si lo que escribió trae un valor y el nombre de la receta trae otro de la misma familia, esa receta no es la que pidió.
 */
const FAMILIAS: string[][][] = [
  // salsa o color
  [['rojo', 'roja', 'rojos', 'rojas', 'coloradito'], ['verde', 'verdes'], ['amarillo', 'amarilla', 'amarillos'], ['negro', 'negra', 'negros', 'negras'], ['blanco', 'blanca'], ['poblano', 'poblana'], ['chipotle'], ['pasilla'], ['guajillo'], ['ranchera', 'ranchero']],
  // lo principal del platillo
  [
    ['pollo', 'pechuga', 'gallina', 'pavo'],
    ['res', 'bistec', 'arrachera', 'filete', 'molida'],
    ['cerdo', 'puerco', 'chuleta', 'chuletas', 'costilla', 'costillas', 'carnitas', 'maciza'],
    ['pescado', 'mojarra', 'huachinango', 'tilapia'],
    ['camaron', 'camarones'],
    ['atun', 'sardina'],
    ['huevo', 'huevos'],
    ['chorizo', 'longaniza'],
    ['tasajo', 'cecina'],
    ['queso', 'quesillo', 'quesadilla', 'quesadillas'],
    ['frijol', 'frijoles'],
    ['papa', 'papas'],
    ['nopal', 'nopales'],
    ['hongos', 'champinones', 'champinon'],
    ['lenteja', 'lentejas'],
    ['jamon'],
    ['tocino'],
    ['flor', 'calabaza', 'calabacita', 'calabacitas'],
  ],
  // sabor
  [['dulce', 'dulces'], ['salado', 'salada']],
  // sabor de bebidas, helados y postres
  [['fresa', 'fresas'], ['platano', 'platanos'], ['mango', 'mangos'], ['papaya'], ['melon'], ['sandia'], ['limon', 'limonada'], ['naranja'], ['jamaica'], ['tamarindo'], ['horchata'], ['pina'], ['manzana'], ['durazno'], ['guayaba'], ['coco']],
  // sabor de pasteles y galletas
  [['vainilla'], ['chocolate', 'chocolatosa', 'chocolates'], ['avena'], ['mantequilla'], ['zanahoria'], ['leches'], ['elote'], ['queso'], ['nuez', 'nueces']],
];

function valorEnFamilia(familia: string[][], w: string): number {
  return familia.findIndex((grupo) => grupo.some((x) => igual(x, w)));
}

/** ¿Alguna palabra de lo escrito choca con una palabra del nombre de la receta? */
export function contradictorio(ut: string[], nt: string[]): boolean {
  return FAMILIAS.some((fam) => {
    const mias = new Set(ut.map((w) => valorEnFamilia(fam, w)).filter((v) => v >= 0));
    const suyas = new Set(nt.map((w) => valorEnFamilia(fam, w)).filter((v) => v >= 0));
    if (!mias.size || !suyas.size) return false;
    return ![...mias].some((v) => suyas.has(v));
  });
}

/* ───────── palabras de ingrediente suelto ───────── */

const CATEGORIAS_CRUDAS = new Set(['ave', 'carne', 'pescado', 'lacteo', 'verdura', 'fruta', 'despensa', 'masa']);
/** Palabras que casi nunca piden una receta aunque estén en el nombre de varias («agua», «sal»…). */
const BLOQUEADAS = new Set(['agua', 'sal', 'azucar', 'aceite', 'pan', 'leche', 'carne', 'harina', 'fruta', 'verdura', 'verduras', 'frutas']);

/** Palabras que el diccionario liga a un ingrediente pero que casi siempre piden el platillo («lasaña», «milanesas»). */
const PLATILLOS_QUE_PARECEN_INGREDIENTE = new Set(['lasana', 'lasanas', 'lasagna', 'milanesa', 'milanesas']);

let CRUDOS: Set<string> | null = null;
/** Palabra que nombra un ingrediente que se compra para cocinar («pollo», «huevo», «queso»): sola, no pide una receta. */
export function esCrudo(w: string): boolean {
  if (PLATILLOS_QUE_PARECEN_INGREDIENTE.has(w)) return false;
  if (!CRUDOS) {
    const set = new Set<string>();
    for (const ing of Object.values(INGREDIENTES)) {
      if (ing.platillo || !CATEGORIAS_CRUDAS.has(ing.cat)) continue;
      for (const f of ing.frases) if (f.length === 1) set.add(f[0]);
    }
    CRUDOS = set;
  }
  if (BLOQUEADAS.has(w)) return true;
  for (const c of CRUDOS) if (igual(w, c)) return true;
  return false;
}

/* ───────── otras formas de llamar al mismo platillo ───────── */

/** Frases (sin acentos) que significan lo mismo que una receta que ya existe. */
const SINONIMOS: [frase: string, ids: string[]][] = [
  ['agua de limon', ['limonada']],
  ['limonada natural', ['limonada']],
  ['agua de sandia', ['agua-fruta']],
  ['agua de melon', ['agua-fruta']],
  ['agua de pina', ['agua-fruta']],
  ['agua de mango', ['agua-fruta']],
  ['agua de fresa', ['agua-fruta']],
  ['agua de papaya', ['agua-fruta']],
  ['agua de guayaba', ['agua-fruta']],
  ['agua de naranja', ['agua-fruta']],
  ['sopa de fideo', ['sopa-pasta']],
  ['sopa de fideos', ['sopa-pasta']],
  ['sopa de codito', ['sopa-pasta']],
  ['sopa de coditos', ['sopa-pasta']],
  ['sopa de letras', ['sopa-pasta']],
  ['sopa de estrellitas', ['sopa-pasta']],
  ['mole', ['pollo-mole']],
  ['mole con pollo', ['pollo-mole']],
  ['pollo en mole', ['pollo-mole']],
  ['mole negro', ['pollo-mole']],
  ['mole negro con pollo', ['pollo-mole']],
  ['mole oaxaqueno', ['pollo-mole']],
  ['arroz a la mexicana', ['arroz-rojo']],
  ['arroz mexicano', ['arroz-rojo']],
  ['frijoles de olla', ['frijoles-olla']],
  ['frijoles cocidos', ['frijoles-olla']],
  ['tostadas de tinga', ['tinga-pollo']],
  ['tacos de tinga', ['tinga-pollo']],
  ['champurrado', ['atole-masa']],
  ['atole', ['atole-masa']],
  ['chocolate caliente', ['chocolate-pan-yema']],
  ['hot cakes', ['hotcakes-miel-platano']],
  ['hotcakes', ['hotcakes-miel-platano']],
  ['pancakes', ['hotcakes-miel-platano']],
  ['panqueques', ['hotcakes-miel-platano']],
  ['torrejas', ['pan-frances']],
  ['french toast', ['pan-frances']],
  ['tres leches', ['pastel-tres-leches']],
  ['lasagna', ['lasana-carne']],
  ['carne asada', ['carne-asada']],
  ['tacos de carne asada', ['carne-asada']],
  ['carnitas', ['carnitas-cerdo']],
  ['salsa de molcajete', ['salsa-roja']],
  ['salsa de tomate verde', ['salsa-verde']],
  ['salsa de tomatillo', ['salsa-verde']],
  ['elote asado', ['elote-cocido']],
  ['elotes', ['elote-cocido']],
  ['pozole', ['pozole-rojo']],
  ['sopa azteca', ['sopa-tortilla']],
  ['sopa de tortillas', ['sopa-tortilla']],
  ['agua de pepino', ['agua-pepino-limon']],
  ['pastel de cumpleanos', ['pastel-vainilla']],
  ['pastel de cumple', ['pastel-vainilla']],
  ['pastel de cumpleaños', ['pastel-vainilla']],
  ['pollo al horno', ['pollo-horno-papas']],
  ['pollo en crema de poblano', ['pollo-crema-poblano']],
  ['bistec a la mexicana', ['bistec-mexicana']],
  ['salsa de chile pasilla', ['salsa-pasilla']],
  ['salsa pasilla', ['salsa-pasilla']],
  ['salsa de jitomate', ['salsa-roja']],
  ['salsa roja', ['salsa-roja']],
  ['chocolate oaxaqueno', ['chocolate-agua']],
  ['chocolate de agua', ['chocolate-agua']],
  ['tacos de carnitas', ['carnitas-cerdo']],
  ['pan de muertos', ['pan-muerto']],
  ['pan de muerto', ['pan-muerto']],
  ['pasta a la crema', ['pasta-alfredo']],
  ['fettuccine alfredo', ['pasta-alfredo']],
  ['espagueti alfredo', ['pasta-alfredo']],
  ['bunuelos', ['bunuelos-miel']],
  ['frijoles refritos', ['frijoles-refritos']],
  ['arroz blanco', ['arroz-blanco']],
  ['sandwich', ['sandwich-jamon-queso']],
  ['sandwiches', ['sandwich-jamon-queso']],
  ['torta de jamon', ['tortas-jamon']],
  ['tortas de jamon', ['tortas-jamon']],
  ['hotdog', ['hot-dogs']],
  ['hotdogs', ['hot-dogs']],
  ['perros calientes', ['hot-dogs']],
  ['hamburguesa', ['hamburguesas']],
  ['hamburguesas', ['hamburguesas']],
];

/** Palabras de ingrediente que, al pedir una receta, llevan a un platillo cuyo nombre empieza con otra palabra. */
const RELACIONADAS: [palabra: string, ids: string[]][] = [
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
  ['nopal', ['ensalada-nopales', 'nopal-roja', 'nopal-verde']],
  ['pollo', ['pollo-mole', 'caldo-pollo', 'tostadas-pollo', 'tinga-pollo', 'pollo-roja', 'pollo-salsa-verde']],
  ['atole', ['atole-masa']],
  ['champurrado', ['atole-masa']],
  ['cafe', ['cafe-de-olla']],
  ['hotcakes', ['hotcakes-miel-platano']],
  ['jamaica', ['agua-jamaica']],
  ['camote', ['camotes-piloncillo']],
  ['calabaza', ['calabaza-tacha']],
  ['pescado', ['pescado-ajo-limon', 'pescado-empanizado', 'mojarra-frita', 'pescado-verde']],
  ['camaron', ['camarones-ajillo', 'ceviche-camaron', 'caldo-camaron', 'camaron-diabla']],
  ['milanesa', ['milanesas']],
  ['chuleta', ['chuletas-salsa-verde']],
  ['chicharron', ['chicharron-salsa-verde']],
  ['papa', ['papas-chorizo', 'tacos-dorados-papa', 'pure-papa']],
  ['sopa', ['sopa-pasta', 'sopa-lentejas', 'sopa-tortilla', 'sopa-verduras']],
  ['huevo', ['huevos-mexicana', 'huevos-rancheros', 'huevos-chorizo', 'huevo-roja']],
  ['res', ['bistec-encebollado', 'carne-asada', 'res-roja', 'picadillo-papa']],
  ['carne', ['carne-asada', 'bistec-encebollado', 'picadillo-papa', 'res-roja']],
  ['cerdo', ['carnitas-cerdo', 'costillas-salsa-roja', 'cerdo-verde', 'chuletas-salsa-verde']],
  ['pasta', ['sopa-pasta', 'pasta-alfredo', 'pasta-verduras', 'lasana-carne']],
  ['verdura', ['sopa-verduras', 'verduras-vapor', 'ensalada-verduras', 'calabacitas-jitomate']],
  ['lenteja', ['sopa-lentejas']],
];

const SINONIMOS_POR_ID = new Map<string, string[][]>();
for (const [frase, ids] of SINONIMOS) {
  for (const id of ids) {
    const lista = SINONIMOS_POR_ID.get(id) ?? [];
    lista.push(tokens(frase).filter((w) => !PARTICULAS.has(w)));
    SINONIMOS_POR_ID.set(id, lista);
  }
}

const NOMBRES = new Map<string, string[]>();
const nombreDe = (r: Receta) => {
  let t = NOMBRES.get(r.id);
  if (!t) {
    // «Pay de limón (sin horno)» y «Nieve de limón sin máquina» se piden como «pay de limón» y «nieve de limón»
    // Y «Carne de res en salsa roja» se pide como «res en salsa roja»
    const corto = r.nombre.replace(/\(.*?\)/g, ' ').replace(/\bsin\b.*$/i, ' ').replace(/\bcarne de\b/gi, ' ');
    t = tokens(corto).filter((w) => !PARTICULAS.has(w));
    NOMBRES.set(r.id, t);
  }
  return t;
};

const coincide = (q: string, w: string) => palabraCoincide(q, w, w.length >= 7) > 0;

interface Candidata {
  r: Receta;
  tipo: 'exacta' | 'variante' | 'cercana';
  puntos: number;
  /** Palabras de lo escrito que no están en el nombre de la receta y no son neutras. */
  sobran: string[];
}

function evaluar(ut: string[], toksConParticulas: string[], nt: string[], alias: boolean): Omit<Candidata, 'r'> | null {
  if (!nt.length) return null;
  const cubierta = nt.map((w) => ut.some((q) => coincide(q, w)));
  const cubiertas = cubierta.filter(Boolean).length;
  if (!cubiertas) return null;
  const sobran = ut.filter((q) => !nt.some((w) => coincide(q, w)) && !esNeutra(q) && !LIGERAS.has(q) && q !== 'carne');
  const faltan = nt.filter((w, k) => !cubierta[k]);
  const contradice = contradictorio(ut, nt);

  // Lo que sobra se acepta si es algo que se le agrega («con arroz», «sin picante»), no si cambia el platillo («de coco»)
  const agregados = sobran.every((q) => {
    const k = toksConParticulas.indexOf(q);
    const antes = k > 0 ? toksConParticulas[k - 1] : '';
    return antes === 'con' || antes === 'y' || antes === 'e' || antes === 'sin';
  });

  if (!contradice && faltan.every((w) => LIGERAS.has(w)) && (!sobran.length || agregados)) {
    return { tipo: 'exacta', puntos: 200 + nt.length * 10 - sobran.length * 3 + (alias ? 10 : 0), sobran };
  }
  if (!contradice && !alias && !sobran.length && cubierta[0] && ut.some((w) => w.length >= 4)) {
    return { tipo: 'variante', puntos: 100 + cubiertas * 10 - faltan.length * 4, sobran };
  }
  const compartida = ut.some((q) => nt.some((w) => coincide(q, w) && !esCrudo(w) && !PREPARACIONES.has(w) && w.length >= 5));
  if (cubiertas >= 2 || compartida) {
    return { tipo: 'cercana', puntos: cubiertas * 10 - sobran.length - faltan.length - (contradice ? 5 : 0), sobran };
  }
  return null;
}

/**
 * Qué recetas corresponden a lo que escribió la persona.
 * `pideReceta`: dijo «receta de…» o «cómo se hace…»; entonces hasta una palabra de ingrediente («arroz») pide platillos.
 * `ignorar`: palabras que ya se entendieron como otra cosa («solo verduras») y no deben buscarse en los nombres.
 */
export function calzar(texto: string, opc: { pideReceta?: boolean; ignorar?: ReadonlySet<string> } = {}): Calce {
  const p = limpiarPlatillo(texto);
  const toks = opc.ignorar ? p.toks.filter((w) => !opc.ignorar?.has(w)) : p.toks;
  const ut = toks.filter((w) => !PARTICULAS.has(w));
  if (!ut.length) return NINGUNO;
  const pide = !!opc.pideReceta;

  // Si la IA ya escribió una receta para esta misma petición, es esa
  const guardada = recetaIAPorClave(toks.join(' '));
  if (guardada) return { tipo: 'exacta', recetas: [guardada], pura: true, soloCrudos: false };

  const soloCrudos = ut.every(esCrudo);
  const mejores = new Map<string, Candidata>();
  const proponer = (c: Candidata) => {
    const previa = mejores.get(c.r.id);
    if (!previa || c.puntos > previa.puntos) mejores.set(c.r.id, c);
  };
  for (const r of todasLasRecetas()) {
    const nombre = evaluar(ut, toks, nombreDe(r), false);
    if (nombre) proponer({ r, ...nombre });
    for (const alias of SINONIMOS_POR_ID.get(r.id) ?? []) {
      const e = evaluar(ut, toks, alias, true);
      if (e) proponer({ r, ...e });
    }
  }
  if (pide) {
    for (const [palabra, ids] of RELACIONADAS) {
      if (!ut.some((q) => igual(q, palabra))) continue;
      for (const id of ids) {
        const r = todasLasRecetas().find((x) => x.id === id);
        if (r && !mejores.has(id)) mejores.set(id, { r, tipo: 'variante', puntos: 90, sobran: [] });
      }
    }
  }

  const todas = [...mejores.values()];
  const por = (tipo: Candidata['tipo']) => todas.filter((c) => c.tipo === tipo).sort((a, b) => b.puntos - a.puntos);

  const exactas = por('exacta');
  if (exactas.length) {
    const tope = exactas[0].puntos - 15;
    const buenas = exactas.filter((c) => c.puntos >= tope).slice(0, 3);
    return { tipo: 'exacta', recetas: buenas.map((c) => c.r), pura: buenas[0].sobran.length === 0, soloCrudos };
  }
  const variantes = por('variante');
  if (variantes.length && (!soloCrudos || pide)) {
    return { tipo: 'variantes', recetas: variantes.slice(0, 3).map((c) => c.r), pura: true, soloCrudos };
  }
  const cercanas = por('cercana');
  if (cercanas.length) return { tipo: 'cercanas', recetas: cercanas.slice(0, 3).map((c) => c.r), pura: false, soloCrudos };
  return { ...NINGUNO, soloCrudos };
}

/* ───────── ¿habla de un platillo? ───────── */

/** Palabras que muestran que la persona habla de otra cosa (tiendas, precios, la app) y no de un platillo. */
const NO_ES_PLATILLO = new Set(
  (
    'tienda tiendas negocio negocios precio precios cuesta cuestan cuanto cuantos abierto abierta abre cierra horario horarios domicilio envio envios oferta ofertas ' +
    'promocion promociones descuento descuentos ubicacion direccion telefono whatsapp cuenta pedido pedidos apartar pagar pago tarjeta transferencia comerciante ' +
    'vendedor calificacion estrellas resena resenas cerca lejos hola gracias adios ayuda ayudame app aplicacion mercaboot boti error problema funciona quien eres ' +
    'nombre donde cuando porque como cual cuales'
  ).split(' '),
);

/** Palabras que abren el nombre de un platillo aunque el diccionario también las conozca como ingrediente. */
const CABEZAS = new Set(
  (
    'sopa sopas crema cremas caldo caldos ensalada ensaladas pasta pastas arroz tostada tostadas tlayuda tlayudas memela memelas sope sopes elote elotes tamal tamales ' +
    'taco tacos torta tortas quesadilla quesadillas enchilada enchiladas burrito burritos empanada empanadas molletes chilaquiles pozole mole pure guiso guisado ' +
    'estofado relleno rellenos rellena rellenas rollo rollos rollitos bolitas croquetas tinga'
  ).split(' '),
);

/** Palabras que dicen cómo se prepara algo: con ellas hasta «pollo en…» es un platillo y no solo un ingrediente. */
const PREPARACIONES = new Set(
  (
    'salsa adobo adobado adobada pipian horno parrilla plancha frito frita fritos fritas empanizado empanizada empanizados asado asada asados asadas ahogado ahogada ' +
    'rostizado rostizada cocido cocida vapor ajillo diabla veracruzana pastor gratinado gratinada estofado caldillo enchilado enchilada encacahuatado chipotle pibil ' +
    'cochinita barbacoa guisado estilo nogada teriyaki bbq barbecue agridulce curry tikka masala kebab wok tempura katsu parmesana marsala piccata cacciatore fajitas thai'
  ).split(' '),
);

/** Palabras de conversación («lo que sea», «otra opción», «no sé»): por sí solas nunca nombran un platillo. */
const CONVERSACION = new Set(
  (
    'sea cualquiera cualquier cosa cosas nada todo todos todas algo alguna alguno mas menos otra otro otras otros opcion opciones distinto distinta diferente diferentes ' +
    'si no quiza quizas tal vez pues bueno bien mal mejor peor ya aun todavia siempre nunca tambien ademas entonces luego despues antes ahora hoy manana ayer aqui alla ahi ' +
    'gusta gustan gustaria prefiero prefieres puedes podrias podemos quieres queremos sabes sabe dices dijiste entendi entiendo repite repetir explica explicame cuentame ' +
    'tiempo minutos horas tarda tardo calorias veces vez primero primera ultimo ultima anterior siguiente este esta esto ese esa eso estos estas esos esas mismo misma igual ' +
    'tipo clase cual cuales quien quienes cuando donde porque pero sino aunque como hola adios gracias favor ok vale claro listo perfecto ' +
    'ninos ninas nino nina bebes bebe abuelos abuela abuelo adultos visitas amigos amigas pareja hijos hijas hijo hija peques chiquitos mama novia novio esposa esposo'
  ).split(' '),
);

/**
 * ¿Lo que escribió suena a un platillo (aunque no esté en el recetario) y no a una tienda, un precio o un ingrediente suelto?
 * `pide`: dijo «receta de…» o «cómo se hace…»; entonces cualquier nombre se toma como un platillo.
 * `hayIngredientes`: el diccionario reconoció algún ingrediente; entonces se pide una senal más fuerte,
 * porque «huevo de rancho» o «queso de cabra» son productos y «galletas de naranja» o «pollo en salsa de cacahuate» son platillos.
 */
export function parecePlatillo(toks: string[], pide: boolean, hayIngredientes = false): boolean {
  const ut = toks.filter((w) => !PARTICULAS.has(w));
  if (!ut.length || ut.length > 8) return false;
  if (ut.some((w) => NO_ES_PLATILLO.has(w))) return false;
  const contenido = ut.filter((w) => !esNeutra(w) && !LIGERAS.has(w) && !CONVERSACION.has(w));
  if (!contenido.length || contenido.join('').length < 3) return false;
  if (pide) return true;
  const senal = contenido.length >= 2 && contenido.some((w) => CABEZAS.has(w) || PREPARACIONES.has(w));
  if (hayIngredientes) return (contenido[0].length >= 3 && !esCrudo(contenido[0])) || senal;
  return contenido.some((w) => w.length >= 3 && !esCrudo(w)) || senal;
}
