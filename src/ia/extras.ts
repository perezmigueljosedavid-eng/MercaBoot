import type { Negocio } from '../data/tipos';
import { alertaCoincide, terminoDeAlerta } from './alertas';
import { conIngredientes, Item, mejorPrimero } from './catalogo';
import { ordenarTiendas, vistasNegocios } from './consultas';
import { entender } from './entender';
import { buscarPorNombre, vistaDonde } from './evaluar';
import { Ctx, lista, Parcial, plural } from './frases';
import { norm } from './texto';
import { MEMORIA_INICIAL } from './vista';

/**
 * Lo que Boti sabe hacer además de recetas y precios:
 *  · «Avísame cuando haya aguacate»  → pide que la app guarde el aviso (la pantalla lo hace; aquí solo se entiende).
 *  · «Mi mandado: huevo, tortillas, jitomate» → dice qué tienda (o qué combinación) reúne la lista.
 *  · «¿Qué tiendas están abiertas?»  → las que atienden ahora, de la más cercana a la más lejana.
 * Todo con lo que las tiendas tienen publicado hoy; nunca inventa que algo existe.
 * Autor: José David Pérez Miguel
 */

const limpiarFrase = (texto: string) =>
  norm(texto)
    .replace(/[¿?¡!.,;:()"«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* ───────── «avísame cuando haya …» ───────── */

const RE_AVISAR = /\b(avis\w*|notific\w*|hazme saber|hazmelo saber)\b/;
const RE_QUITAR_AVISO = /\b(ya no (?:me )?avises?|no me avises?|quita(?:r|me)? (?:el )?aviso|cancela(?:r)? (?:el )?aviso|borra(?:r)? (?:el )?aviso)\b/;
/** Lo que no es un producto: avisos sobre pedidos, mensajes o la tienda misma. */
const RE_NO_PRODUCTO = /\b(pedido|pedidos|mensaje|mensajes|chat|contest\w*|respond\w*|abra|abran|abre|abren|cierre|cierren|promo\w*|oferta\w*|listo|lista|llegue mi|llegue el)\b/;
const RELLENO_INICIO =
  /^(?:ya |se |me |les |alguna tienda |alguien |en alguna tienda |en las tiendas )?(?:haya|hay|hubiera|tengan|tenga|tienen|tiene|lleguen|llegue|llegan|llega|vendan|vende|venden|consigan|consiga|traigan|traiga|vuelva|vuelvan|salga|salgan|encuentren|encuentre|esten|este)\b\s*/;
const ARTICULO_INICIO = /^(?:de |del |el |la |los |las |un |una |unos |unas |algo de |mas |mas de )/;
const RELLENO_FINAL = /\b(?:en alguna tienda|en las tiendas|en cualquier tienda|en alguna|por favor|porfa|gracias|disponibles?|aqui|en mercaboot|en la app)\b.*$/;

/** El producto que se espera en «avísame cuando haya aguacate». `undefined` si no es una petición de aviso de producto. */
export function productoEsperado(texto: string): { termino: string | null } | undefined {
  const t = limpiarFrase(texto);
  if (!RE_AVISAR.test(t)) return undefined;
  const m = /\b(?:cuando|en cuanto|apenas|si)\b(.*)$/.exec(t);
  if (!m) return undefined;
  let resto = m[1].trim();
  if (RE_NO_PRODUCTO.test(resto)) return undefined;
  for (let i = 0; i < 4; i++) {
    const antes = resto;
    resto = resto.replace(RELLENO_INICIO, '').replace(ARTICULO_INICIO, '').trim();
    if (resto === antes) break;
  }
  resto = resto.replace(RELLENO_FINAL, '').trim();
  return { termino: terminoDeAlerta(resto) };
}

function pedirAlerta(texto: string, ctx: Ctx): Parcial | null {
  const pedido = productoEsperado(texto);
  if (!pedido) return null;
  if (!pedido.termino) {
    return {
      bloques: [{ t: 'texto', texto: '¿De qué producto quieres que te avise? Escríbelo así: «avísame cuando haya aguacate».' }],
      chips: ['Avísame cuando haya aguacate', '¿Qué hay hoy?'],
    };
  }
  const termino = pedido.termino;
  // Si ya hay, no hace falta esperar
  const ya = ctx.cat.items.filter((i) => alertaCoincide(i.p.nombre, termino)).sort(mejorPrimero);
  if (ya.length) {
    return {
      bloques: [
        { t: 'texto', texto: `¡Ya hay **${termino}**! No hace falta esperar: estas tiendas lo tienen ahora.` },
        { t: 'productos', items: ya.slice(0, 5).map((i) => vistaDonde(i)) },
      ],
      chips: ['Por precio', 'Tiendas cerca de mí', '¿Qué hay hoy?'],
      ok: true,
    };
  }
  return {
    bloques: [{ t: 'texto', texto: `Listo. Ahora ninguna tienda tiene **${termino}**; te aviso en cuanto una lo marque como disponible.` }],
    chips: ['¿Qué hay hoy?', 'Tiendas cerca de mí', 'Algo barato'],
    alerta: termino,
  };
}

function quitarAlerta(texto: string): Parcial | null {
  const t = limpiarFrase(texto);
  if (!RE_QUITAR_AVISO.test(t)) return null;
  const resto = t.replace(RE_QUITAR_AVISO, ' ').replace(/\b(?:de|del|el|la|los|las|sobre|que|cuando|haya|hay)\b/g, ' ');
  const termino = terminoDeAlerta(resto);
  if (!termino) {
    return { bloques: [{ t: 'texto', texto: '¿De qué producto quieres que ya no te avise? Por ejemplo: «ya no me avises de aguacate».' }], chips: [] };
  }
  return { bloques: [{ t: 'texto', texto: `Listo, ya no te aviso de **${termino}**.` }], chips: ['¿Qué hay hoy?'], quitarAlerta: termino };
}

/* ───────── mi mandado ───────── */

const RE_MANDADO = /\b(mandado|mi lista|lista de compras?|lista del super|lista de la compra|lista para comprar)\b/;
const RE_VERBO_COMPRA = /\b(necesito|ocupo|me faltan?|voy a comprar|quiero comprar|tengo que comprar|debo comprar|hay que comprar|a comprar)\b/;
const UNIDADES =
  /^(?:\d+(?:[.,]\d+)?\s*)?(?:(?:kilos?|kgs?|gramos?|litros?|lts?|piezas?|pzas?|docenas?|paquetes?|bolsas?|latas?|botes?|cajas?|manojos?|medio|media|cuarto|un|una|unos|unas|dos|tres|cuatro|cinco)\s+)*(?:de\s+)?/;

/** Los productos de una lista escrita con comas, saltos de línea o «y». */
export function piezasDeLista(texto: string): string[] {
  let t = norm(texto).replace(/[¿?¡!.()"«»]/g, ' ');
  const dosPuntos = t.indexOf(':');
  if (dosPuntos >= 0 && dosPuntos < 60) t = t.slice(dosPuntos + 1);
  else t = t.replace(/^.*?\b(?:mandado|mi lista|lista de compras?|lista del super|lista de la compra|lista para comprar|necesito|ocupo|me faltan?|voy a comprar|quiero comprar|tengo que comprar|debo comprar|hay que comprar|a comprar)\b(?: es| son| de)?/, ' ');
  const piezas = t
    .split(/[,;\n+]|\sy\s|\se\s/)
    .map((x) => x.trim().replace(UNIDADES, '').replace(/\b(?:por favor|porfa|gracias)\b/g, '').replace(/\s+/g, ' ').trim())
    .filter((x) => /[a-z]{3,}/.test(x));
  return [...new Set(piezas)].slice(0, 12);
}

/** Lo que las tiendas tienen publicado de lo que se pidió (de una palabra o de varias). */
function buscarPieza(ctx: Ctx, pieza: string): Item[] {
  const { cat } = ctx;
  const e = entender(pieza, cat.negocios, MEMORIA_INICIAL);
  const vistos = new Set<string>();
  const res: Item[] = [];
  const poner = (l: Item[]) => {
    for (const it of l) {
      if (vistos.has(it.p.id)) continue;
      vistos.add(it.p.id);
      res.push(it);
    }
  };
  for (const g of e.grupos.slice(0, 2)) poner(conIngredientes(cat, g));
  if (!res.length) poner(buscarPorNombre(cat, e.palabras));
  return res.sort(mejorPrimero);
}

interface Parada {
  negocio: Negocio;
  llevas: { pieza: string; it: Item }[];
}

function mandado(texto: string, ctx: Ctx): Parcial | null {
  const t = limpiarFrase(texto);
  const explicito = RE_MANDADO.test(t);
  const piezas = piezasDeLista(texto);
  // Sin la palabra «mandado» o «lista», solo se toma como lista si trae varias cosas y un verbo de compra
  if (!explicito && !(RE_VERBO_COMPRA.test(t) && piezas.length >= 3)) return null;
  if (!piezas.length) {
    return {
      bloques: [{ t: 'texto', texto: 'Escríbeme tu lista separada por comas y te digo qué tienda la reúne. Por ejemplo: «mi mandado: huevo, tortillas, jitomate, aguacate».' }],
      chips: ['Mi mandado: huevo, tortillas, jitomate', '¿Qué hay hoy?'],
    };
  }
  if (!ctx.cat.items.length) {
    return { bloques: [{ t: 'texto', texto: 'Todavía no hay productos publicados en las tiendas. Cuando los comerciantes marquen lo que tienen, te armo tu mandado.' }], chips: [] };
  }

  const buscadas = piezas.map((pieza) => ({ pieza, items: buscarPieza(ctx, pieza) }));
  const encontradas = buscadas.filter((b) => b.items.length);
  const faltan = buscadas.filter((b) => !b.items.length).map((b) => b.pieza);

  // Se elige la tienda que reúne más cosas; con lo que falta, otra; y así hasta tres paradas
  const paradas: Parada[] = [];
  const pendientes = new Set(encontradas.map((_, i) => i));
  while (pendientes.size && paradas.length < 3) {
    const cuenta = new Map<string, { n: Negocio; idx: number[]; mejor: Item }>();
    for (const i of pendientes) {
      for (const it of encontradas[i].items) {
        const c = cuenta.get(it.n.id) ?? { n: it.n, idx: [], mejor: it };
        if (!c.idx.includes(i)) c.idx.push(i);
        if (mejorPrimero(it, c.mejor) < 0) c.mejor = it;
        cuenta.set(it.n.id, c);
      }
    }
    const elegida = [...cuenta.values()].sort((a, b) => b.idx.length - a.idx.length || mejorPrimero(a.mejor, b.mejor))[0];
    const llevas = elegida.idx.map((i) => {
      const delNegocio = encontradas[i].items.filter((x) => x.n.id === elegida.n.id);
      // si la tienda tiene varias presentaciones, la más barata
      const it = [...delNegocio].sort((a, b) => (a.p.precio ?? Infinity) - (b.p.precio ?? Infinity))[0];
      return { pieza: encontradas[i].pieza, it };
    });
    paradas.push({ negocio: elegida.n, llevas });
    for (const i of elegida.idx) pendientes.delete(i);
  }

  const total = piezas.length;
  const bloques: Parcial['bloques'] = [];
  const cubiertas = encontradas.length - pendientes.size;
  if (!paradas.length) {
    bloques.push({ t: 'texto', texto: `De tu lista (${lista(piezas)}) ahora ninguna tienda tiene nada publicado como disponible.` });
  } else if (paradas.length === 1 && !faltan.length && !pendientes.size) {
    bloques.push({ t: 'texto', texto: `**${paradas[0].negocio.nombre}** tiene toda tu lista (${total} de ${total}). Puedes resolver tu mandado en un solo lugar:` });
  } else if (paradas.length === 1) {
    bloques.push({ t: 'texto', texto: `**${paradas[0].negocio.nombre}** tiene ${cubiertas} de ${total} cosas de tu lista, y es la tienda que reúne más:` });
  } else {
    const partes = paradas.map((p) => `**${p.negocio.nombre}** (${p.llevas.length})`);
    bloques.push({ t: 'texto', texto: `Ninguna tienda tiene todo, pero con ${paradas.length} paradas reúnes ${cubiertas} de ${total}: ${lista(partes)}.` });
  }
  if (paradas.length) {
    const negocios = ordenarTiendas(paradas.map((p) => p.negocio), ctx.cat, 'cerca');
    bloques.push({ t: 'negocios', items: vistasNegocios(negocios, ctx.cat) });
    bloques.push({ t: 'productos', titulo: 'Lo que llevas', items: paradas.flatMap((p) => p.llevas.map((l) => vistaDonde(l.it))) });
  }
  if (pendientes.size) {
    const sinTienda = [...pendientes].map((i) => encontradas[i].pieza);
    bloques.push({ t: 'texto', texto: `Para completar la lista faltaría una cuarta tienda con: ${lista(sinTienda)}. Pregúntame «dónde hay …» de cada una.` });
  }
  if (faltan.length) {
    bloques.push({ t: 'texto', texto: `Ninguna tienda tiene publicado ahora: ${lista(faltan)}. Puedo avisarte cuando alguna lo tenga.` });
  }
  const chips = faltan.slice(0, 2).map((f) => `Avísame cuando haya ${f}`);
  chips.push('Tiendas cerca de mí', '¿Qué hay hoy?');
  return { bloques, chips, ok: paradas.length > 0, sinResultado: faltan.length ? faltan : undefined };
}

/* ───────── tiendas abiertas ───────── */

const RE_ABIERTAS = /\b(abierta|abiertas|abierto|abiertos|atendiendo|atienden|estan abiertas?|ya abrieron|ya abrio)\b/;
const RE_PREGUNTA_TIENDAS = /\b(tienda|tiendas|negocio|negocios|que|cual|cuales|quien|quienes|algo|ahorita|ahora|hay|donde|cerca)\b/;

function abiertas(texto: string, ctx: Ctx): Parcial | null {
  const t = limpiarFrase(texto);
  if (!RE_ABIERTAS.test(t) || !RE_PREGUNTA_TIENDAS.test(t)) return null;
  const { cat } = ctx;
  const propias = cat.negocios.filter((n) => !!n.duenoId);
  if (!propias.length) {
    return { bloques: [{ t: 'texto', texto: 'Todavía no hay tiendas registradas. En cuanto se sumen verás aquí cuáles están abiertas.' }], chips: [] };
  }
  const abiertos = ordenarTiendas(propias.filter((n) => n.abierto), cat, 'cerca');
  if (!abiertos.length) {
    return {
      bloques: [
        { t: 'texto', texto: 'Ahora ninguna tienda está abierta. Los negocios abren y cierran según su horario: entra al perfil de cada tienda para ver cuándo abre.' },
        { t: 'negocios', titulo: 'Las tiendas de la comunidad', items: vistasNegocios(ordenarTiendas(propias, cat, 'cerca').slice(0, 6), cat) },
      ],
      chips: ['Tiendas cerca de mí', '¿Qué hay hoy?'],
      mem: { modo: 'tiendas' },
    };
  }
  const orden = cat.origen && cat.hayUbicaciones ? ', de la más cercana a la más lejana' : '';
  return {
    bloques: [
      { t: 'texto', texto: `Ahora ${abiertos.length === 1 ? 'hay **1 tienda abierta**' : `hay **${abiertos.length} tiendas abiertas**`}${orden}:` },
      { t: 'negocios', items: vistasNegocios(abiertos.slice(0, 8), cat) },
      ...(abiertos.length < propias.length
        ? [{ t: 'texto' as const, texto: `${propias.length - abiertos.length} ${plural(propias.length - abiertos.length, 'tienda está cerrada', 'tiendas están cerradas')} por ahora.` }]
        : []),
    ],
    chips: ['Tiendas mejor calificadas', 'Tiendas con servicio a domicilio', '¿Qué hay hoy?'],
    mem: { modo: 'tiendas' },
  };
}

/** Lo que se intenta antes del entendimiento general. `null` si lo escrito no es de estos temas. */
export function extras(texto: string, ctx: Ctx): Parcial | null {
  return quitarAlerta(texto) ?? pedirAlerta(texto, ctx) ?? mandado(texto, ctx) ?? abiertas(texto, ctx);
}
